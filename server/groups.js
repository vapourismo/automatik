"use strict";

const EventEmitter = require("events");
const db           = require("./database");
const util         = require("./utilities");

class GroupError extends Error {
	constructor(message, cause) {
		super(message);

		this.cause = cause;
	}
}

const groups = {};
const table = new db.Table("groups", "id", ["name", "parent"]);

/**
 * Group handle
 */
class Group {
	constructor(ns, row) {
		this.namespace = ns;
		this.channel = ns.create("group/" + row.data.id);
		this.row = row;

		this.subGroups = new Set();
		this.components = new Set();

		this.channel.register("create", (reply, reject, name) => {
			if (typeof(name) != "string")
				return reject({message: "Parameter 'name' should be a string"});

			this.create(name).then(
				value => reply(),
				error => reject({message: error.message})
			);
		});

		this.channel.register("delete", (reply, reject) => {
			this.delete().then(
				value => reply(),
				error => reject({message: error.message})
			);
		});

		this.channel.register("rename", (reply, reject, name) => {
			if (typeof(name) != "string")
				return reject({message: "Parameter 'name' should be a string"});

			this.rename(name).then(
				value => reply(),
				error => reject({message: error.message})
			);
		});

		this.channel.register("describe", (reply, reject) => {
			reply({
				id:         this.id,
				name:       this.name,
				parent:     this.parent,
				subGroups:  this.subGroups.map(g => ({id: g.id, name: g.name})),
				components: this.components.map(c => ({id: c.id, name: c.name, type: c.type}))
			});
		});
	}

	/**
	 * ID
	 * @type {Number}
	 */
	get id() {
		return this.row.data.id;
	}

	/**
	 * Name
	 * @type {String}
	 */
	get name() {
		return this.row.data.name;
	}

	/**
	 * Parent group ID
	 * @type {Number}
	 */
	get parent() {
		return this.row.data.parent;
	}

	/**
	 * Attach to parent group.
	 */
	attachToParent() {
		if (this.parent in groups)
			groups[this.parent].attachGroup(this);
	}

	/**
	 * Detach from parent group.
	 */
	detachFromParent() {
		if (this.parent in groups)
			groups[this.parent].detachGroup(this);
	}

	/**
	 * Attach a sub-group.
	 * @param {Group} grp Group to be attached
	 */
	attachGroup(grp) {
		const len = this.subGroups.length;
		this.subGroups.add(grp);

		if (len < this.subGroups.length)
			this.channel.trigger("refresh");
	}

	/**
	 * Detach a sub-group.
	 * @param {Group} grp Group to be detached
	 */
	detachGroup(grp) {
		const len = this.subGroups.length;
		this.subGroups.delete(grp);

		if (len > this.subGroups.length)
			this.channel.trigger("refresh");
	}

	/**
	 * Attach a component.
	 * @param {Component} com Component to be attached
	 */
	attachComponent(com) {
		const len = this.components.length;
		this.components.add(com);

		if (len < this.components.length)
			this.channel.trigger("refresh");
	}

	/**
	 * Detach a component.
	 * @param {Component} com Component to be detached
	 */
	detachComponent(com) {
		const len = this.components.length;
		this.components.delete(com);

		if (len > this.components.length)
			this.channel.trigger("refresh");
	}

	// Documentation placeholders

	/**
	 * Create a sub-group.
	 * @param {String} name Group name
	 * @returns {Group} Newly created "Group"
	 */
	create(name) {}

	/**
	 * Rename this group.
	 * @param {String} name New group name
	 */
	rename(name) {}

	/**
	 * Delete this group.
	 */
	delete() {}
}

Group.prototype.create = function* (name) {
	if (name.length < 1)
		throw new GroupError("Group name has to contain at least one character");

	try {
		const row = yield table.insert({name, parent: this.id});

		util.inform("group: " + row.data.id, "Registering '" + row.data.name + "'");
		const group = groups[row.data.id] = new Group(this.namespace, row);

		this.attachGroup(group);

		return group;
	} catch (err) {
		util.error("groups", "Failed to create", err.stack);

		if (err.code == 23505 && (err.constraint == "groups_name_parent_unique" || err.constraint == "groups_name_unique"))
			throw new GroupError("A group with that name already exists", err);
		else if (err.code == 23503 && err.constraint == "groups_parent_fkey")
			throw new GroupError("Parent group does no longer exist", err);
		else if (err.code == 22001)
			throw new GroupError("Group name is too long", err);
		else
			throw new GroupError("Unknown error, check logs", err);
	}
}.async;

Group.prototype.rename = function* (name) {
	const tag = "group: " + this.id;

	try {
		yield this.row.update({name});
		util.inform(tag, "Renamed to '" + this.name + "'");

		if (this.parent in groups)
			groups[this.parent].channel.trigger("refresh");

	} catch (err) {
		util.error(tag, "Failed to rename", err);

		if (err.code == 23505 && (err.constraint == "groups_name_parent_unique" || err.constraint == "groups_name_unique"))
			throw new GroupError("A group with that name already exists", err);
		else
			throw new GroupError("Unknown error, check logs", err);
	}
}.async;

Group.prototype.delete = function* (origin) {
	const tag = "group: " + this.id;

	origin = origin === undefined ? this.parent : origin;

	yield* this.subGroups.map(g => g.delete(origin));

	try {
		this.detachFromParent();
		delete groups[this.id];
		yield this.row.delete();

		this.channel.trigger("delete", origin);
		this.channel.destroy();

		util.inform(tag, "Deleted '" + this.name + "'");
	} catch (err) {
		util.error(tag, "Failed to delete", err);

		if (err.code == 23503 && err.constraint == "groups_parent_fkey")
			throw new GroupError("Non-empty groups cannot be deleted", err);
		else
			throw new GroupError("Unknown error, check logs", err);
	}
}.async;

class BaseGroup extends Group {
	constructor(ns) {
		super(ns, new db.Row(null, {id: null, parent: null, name: null}));
	}
}

BaseGroup.prototype.rename = function* () {
	return util.error(tag, "Cannot rename root group");
}.async;

BaseGroup.prototype.delete = function* () {
	return util.error(tag, "Cannot delete root group");
}.async;

module.exports = {
	load: function* load(ns) {
		groups[null] = new BaseGroup(ns);
		const rows = yield table.load();

		const loaded = rows.map(function (row) {
			util.inform("group: " + row.data.id, "Registering '" + row.data.name + "'");
			return groups[row.data.id] = new Group(ns, row);
		});

		loaded.forEach(g => g.attachToParent());

		return loaded;
	}.async,

	find(id) {
		const grp = groups[id];

		if (grp instanceof Group)
			return grp;
		else
			return null;
	}
};

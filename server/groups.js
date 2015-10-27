"use strict";

const db   = require("./database");
const util = require("./utilities");

class GroupError extends Error {
	constructor(message, cause) {
		super(message);

		this.cause = cause;
	}
}

const groups = {};

class Group {
	constructor(row) {
		this.row = row;
		this.subGroups = [];
	}

	get id() {
		return this.row.data.id;
	}

	get name() {
		return this.row.data.name;
	}

	get parent() {
		return this.row.data.parent;
	}

	attachToParent() {
		if (this.parent in groups)
			groups[this.parent].attach(this);
	}

	detachFromParent() {
		if (this.parent in groups)
			groups[this.parent].detach(this);
	}

	attach(grp) {
		if (this.subGroups.every(g => g != grp))
			this.subGroups.push(grp);
	}

	detach(grp) {
		this.subGroups = this.subGroups.filter(g => g != grp);
	}
}

Group.prototype.rename = function* (name) {
	const tag = "group: " + this.id;

	try {
		yield this.row.update({name: name});
		util.inform(tag, "Renamed to '" + this.name + "'");
	} catch (err) {
		util.error(tag, "Failed to rename", err);

		if (err.code == 23505 && (err.constraint == "groups_name_parent_unique" || err.constraint == "groups_name_unique"))
			throw new GroupError("A group with that name already exists", err);
		else
			throw new GroupError("Unknown error, check logs", err);
	}
}.async;

Group.prototype.delete = function* () {
	const tag = "group: " + this.id;

	yield* this.subGroups.map(g => g.delete());

	try {
		this.detachFromParent();
		delete groups[this.id];
		yield this.row.delete();

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
	constructor() {
		super(new db.Row(null, {parent: null, name: null}));
	}
}

BaseGroup.prototype.rename = function* () {
	return util.error(tag, "Cannot rename root group");
};

BaseGroup.prototype.delete = function* () {
	return util.error(tag, "Cannot delete root group");
};

// Setup root group
groups[null] = new BaseGroup();

const table = new db.Table("groups", "id", ["name", "parent"]);

module.exports = {
	load: function* () {
		const rows = yield table.load();

		const loaded = rows.map(function (row) {
			util.inform("group: " + row.data.id, "Registering '" + row.data.name + "'");
			return groups[row.data.id] = new Group(row);
		});

		loaded.forEach(g => g.attachToParent());

		return loaded;
	}.async,

	create: function* (name, parent) {
		if (name.length < 1)
			throw new GroupError("Group name has to contain at least one character");

		try {
			const row = yield table.insert({name: name, parent: parent});

			util.inform("group: " + row.data.id, "Registering '" + row.data.name + "'");
			const group = groups[row.data.id] = new Group(row);
			group.attachToParent();

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
	}.async,

	find: function (id) {
		const grp = groups[id];

		if (grp instanceof Group)
			return grp;
		else
			return null;
	}
};

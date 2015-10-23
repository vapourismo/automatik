"use strict";

const db   = require("./database");
const util = require("./utilities");

const groups = {};

class Group {
	constructor(row) {
		Object.assign(this, row);
		this.subGroups = [];
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
		if (!(grp in this.subGroups))
			this.subGroups.push(grp);
	}

	detach(grp) {
		this.subGroups = this.subGroups.filter(g => g != grp);
	}
}

Group.prototype.rename = function* (name) {
	const tag = "group: " + this.id;

	try {
		const result = yield db.queryAsync(
			"UPDATE groups SET name = $1 WHERE id = $2 RETURNING name",
			[name, this.id]
		);

		this.name = result.rows[0].name;
		util.inform(tag, "Renamed to '" + this.name + "'");
	} catch (err) {
		util.error(tag, "Failed to rename", err);

		if (err.code == 23505 && (err.constraint == "groups_name_parent_unique" || err.constraint == "groups_name_unique"))
			throw new GroupError("A group with that name already exists", err);
		else
			throw new GroupError("Unknown error, check logs", err);
	}
}.async();

Group.prototype.delete = function* () {
	const tag = "group: " + this.id;

	if (this.id == null)
		return util.error(tag, "Cannot delete root group");

	yield* this.subGroups.map(g => g.delete());

	try {
		yield db.queryAsync("DELETE FROM groups WHERE id = $1", [this.id]);

		this.detachFromParent();
		delete groups[this.id];

		util.inform(tag, "Deleted '" + this.name + "'");
	} catch (err) {
		util.error(tag, "Failed to delete", err);

		if (err.code == 23503 && err.constraint == "groups_parent_fkey")
			throw new GroupError("Non-empty groups cannot be deleted", err);
		else
			throw new GroupError("Unknown error, check logs", err);
	}
}.async();

class GroupError extends Error {
	constructor(message, cause) {
		super(this, message);

		this.message = message;
		this.cause = cause;
	}
}

// Setup root group
groups[null] = new Group({id: null, parent: null, name: null});

module.exports = {
	load: function* () {
		const result = yield db.queryAsync("SELECT * FROM groups");

		// TODO: Review pros and cons of traversing groups only once
		// Theoretically we don't need to traverse the newly loaded groups twice if we sort them
		// by ID in ascending order. Since IDs are higher for groups which have been created at a
		// later point in time and groups can only be attached to groups that already exist (because
		// they have been created earlier, therefore lower ID), each parent group will be available
		// before its children.
		// Note, this only works when reparenting is not allowed.

		result.rows.map(row => {
			util.inform("group: " + row.id, "Registering '" + row.name + "'");
			return groups[row.id] = new Group(row);
		}).forEach(g => g.attachToParent());
	}.async(),

	create: function* (name, parent) {
		if (name.length < 1)
			throw new GroupError("Group name has to contain at least one character");

		try {
			const result = yield db.queryAsync(
				"INSERT INTO groups (name, parent) VALUES ($1, $2) RETURNING *",
				[name, parent]
			);

			// TODO: Review pros and cons of traversing groups only once
			result.rows.map(row => {
				util.inform("group: " + row.id, "Creating '" + row.name + "'");
				return groups[row.id] = new Group(row);
			}).forEach(g => g.attachToParent());
		} catch (err) {
			util.error("groups", "Failed to create", err);

			if (err.code == 23505 && (err.constraint == "groups_name_parent_unique" || err.constraint == "groups_name_unique"))
				throw new GroupError("A group with that name already exists", err);
			else if (err.code == 23503 && err.constraint == "groups_parent_fkey")
				throw new GroupError("Parent group does no longer exist", err);
			else if (err.code == 22001)
				throw new GroupError("Group name is too long", err);
			else
				throw new GroupError("Unknown error, check logs", err);
		}
	}.async(),

	find: function (id) {
		const grp = groups[id];

		if (grp instanceof Group)
			return grp;
		else
			return null;
	}
};

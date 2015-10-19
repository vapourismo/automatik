const db   = require("../database");
const util = require("../utilities");

const groups = {};

const GroupPrototype = {
	attachToParent: function () {
		if (this.parent in groups)
			groups[this.parent].attach(this);
	},

	detachFromParent: function () {
		if (this.parent in groups)
			groups[this.parent].detach(this);
	},

	attach: function (grp) {
		if (!(grp in this.subGroups))
			this.subGroups.push(grp);
	},

	detach: function (grp) {
		this.subGroups = this.subGroups.filter(g => g != grp);
	},

	rename: function (name, callback) {
		const tag = "group: " + this.id;

		db.query(
			"UPDATE groups SET name = $1 WHERE id = $2 RETURNING name",
			[name, this.id],
			function (err, result) {
				if (err) {
					if (err.code == 23505) callback("A group with that name already exists");
					else                   callback("Unknown error, check logs");

					return util.error(tag, "Failed to rename", err);
				}

				this.name = result.rows[0].name;
				util.inform(tag, "Renamed to '" + this.name + "'");

				callback(null);
			}.bind(this)
		);
	},

	delete: function (callback) {
		const tag = "group: " + this.id;

		if (this.id == null)
			return util.error(tag, "Cannot delete root group");

		db.query("DELETE FROM groups WHERE id = $1", [this.id], function (err, result) {
			if (err) {
				callback("Unknown error, check logs", null);
				return util.error(tag, "Failed to delete group", err);
			}

			this.detachFromParent();
			delete groups[this.id];

			util.inform(tag, "Deleted '" + this.name + "'");

			callback(null);
		}.bind(this));
	}
};

function makeGroup(row) {
	row.__proto__ = GroupPrototype;
	row.subGroups = [];

	util.inform("group: " + row.id, "Configured '" + row.name + "'");
	return groups[row.id] = row;
}

// Setup root group
makeGroup({id: null, parent: null, name: null});

var loadedGroups = false;
function loadGroups(callback) {
	if (loadedGroups) {
		callback();
		return;
	}

	db.query("SELECT * FROM groups", function (err, result) {
		if (err) return util.abort("groups", "Failed to fetch instances", err);

		result.rows.map(makeGroup).forEach(g => g.attachToParent());

		loadGroups = true;
		if (callback) callback();
	});
}

function findGroup(id) {
	const grp = groups[id];

	if (typeof(grp) == "object" && grp.__proto__ == GroupPrototype)
		return grp;
	else
		return null;
}

function createGroup(name, parent, callback) {
	db.query(
		"INSERT INTO groups (name, parent) VALUES ($1, $2) RETURNING *",
		[name, parent],
		function (err, result) {
			if (err) {
				if (err.code == 23505)      callback("A group with that name already exists");
				else if (err.code == 22001) callback("Group name is too long");
				else                        callback("Unknown error, check logs");

				return util.error("groups", "Failed to create group", err);
			}

			result.rows.map(makeGroup).forEach(g => g.attachToParent());
			callback(null);
		}
	);
}

module.exports = {
	load:   loadGroups,
	create: createGroup,
	find:   findGroup,
};

const util     = require("./utilities");
const groups   = require("./data/groups");

function BrowserClient(client) {
	this.server = client.server;
	this.client = client;

	this.client.on("GetGroupInfo", this.onGetGroupInfo.bind(this));
	this.client.on("CreateGroup",  this.onCreateGroup.bind(this));
	this.client.on("RenameGroup",  this.onRenameGroup.bind(this));
	this.client.on("DeleteGroup",  this.onDeleteGroup.bind(this));
}

BrowserClient.prototype = {
	onGetGroupInfo: function (id) {
		const grp = groups.find(id);

		if (grp)
			this.client.emit("GetGroupInfo", {
				id: id,
				name: grp.name,
				parent: grp.parent,
				subGroups: grp.subGroups.map(g => ({id: g.id, name: g.name}))
			});
	},

	onCreateGroup: function (info) {
		if (typeof(info) != "object" || typeof(info.name) != "string" || (typeof(info.parent) != "number" && info.parent != null))
			return util.error("communication", "Invalid parameter to 'CreateGroup' directive", info);

		groups.create(info.name, info.parent).then(
			val => this.updateGroup(info.parent),
			err => this.displayError(err.message)
		);
	},

	onRenameGroup: function (info) {
		if (typeof(info) != "object" || typeof(info.name) != "string" || typeof(info.id) != "number")
			return util.error("communication", "Invalid parameter to 'RenameGroup' directive");

		const grp = groups.find(info.id);

		if (grp) {
			grp.rename(info.name).then(
				val => {
					this.updateGroup(grp.id);
					this.updateGroup(grp.parent);
				},
				err => this.updateGroupFailed(grp.id, err.message)
			);
		} else {
			util.error("communication", "Cannot find group #" + info.id);
			this.displayError("Cannot find group #" + info.id);
		}
	},

	onDeleteGroup: function (id) {
		if (typeof(id) != "number")
			return util.error("communication", "Invalid parameter to 'DeleteGroup' directive");

		const grp = groups.find(id);

		if (grp) {
			grp.delete().then(
				val => this.updateGroup(grp.parent),
				err => this.updateGroupFailed(grp.id, err.message)
			);
		} else {
			util.error("communication", "Cannot find group #" + id);
			this.displayError("Cannot find group #" + id);
		}
	},

	updateGroup: function (id) {
		this.server.emit("UpdateGroup", id);
	},

	updateGroupFailed: function (id, msg) {
		this.client.emit("UpdateGroupFailed", {
			id: id,
			message: msg
		});
	},

	displayError: function (err) {
		this.client.emit("DisplayError", err);
	}
};

module.exports = function (server) {
	server.on("connection", client => new BrowserClient(client));
};

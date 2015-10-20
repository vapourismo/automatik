const SocketIO = require("socket.io");
const data     = require("./data");
const util     = require("./utilities");

function BrowserClient(server, client) {
	this.server = server;
	this.client = client;

	this.client.on("ListSubGroups", this.onListSubGroups.bind(this));
	this.client.on("GetGroupInfo",  this.onGetGroupInfo.bind(this));
	this.client.on("CreateGroup",   this.onCreateGroup.bind(this));
	this.client.on("RenameGroup",   this.onRenameGroup.bind(this));
	this.client.on("DeleteGroup",   this.onDeleteGroup.bind(this));
}

function flattenGroup(grp) {
	return {id: grp.id, name: grp.name};
}

BrowserClient.prototype = {
	onListSubGroups: function (id) {
		const grp = data.groups.find(id);

		if (grp)
			this.client.emit("ListSubGroups", {
				group: id,
				subGroups: grp.subGroups.map(g => ({id: g.id, name: g.name}))
			});
	},

	onGetGroupInfo: function (id) {
		const grp = data.groups.find(id);
		if (grp) this.client.emit("GetGroupInfo", {id: grp.id, name: grp.name});
	},

	onCreateGroup: function (info) {
		if (typeof(info) != "object" || typeof(info.name) != "string" || (typeof(info.parent) != "number" && info.parent != null))
			return util.error("communication", "Invalid parameter to 'CreateGroup' directive", info);

		data.groups.create(info.name, info.parent).then(
			_   => this.updateGroup(info.parent),
			err => this.displayError(err.message)
		);
	},

	onRenameGroup: function (info) {
		if (typeof(info) != "object" || typeof(info.name) != "string" || typeof(info.id) != "number")
			return util.error("communication", "Invalid parameter to 'RenameGroup' directive");

		const grp = data.groups.find(info.id);

		if (grp)
			grp.rename(info.name).then(
				_   => { this.updateGroup(grp.id); this.updateGroup(grp.parent); },
				err => this.displayError(err.message)
			);
		else
			this.displayError("Cannot find group #" + info.id);
	},

	onDeleteGroup: function (id) {
		if (typeof(id) != "number")
			return util.error("communication", "Invalid parameter to 'DeleteGroup' directive");

		const grp = data.groups.find(id);

		if (grp)
			grp.delete().then(
				_   => { this.onListSubGroups(); this.updateGroup(grp.parent); },
				err => this.displayError(err.message)
			);
		else
			this.displayError("Cannot find group #" + id);
	},

	updateGroup: function (group) {
		this.server.emit("UpdateGroup", group);
	},

	displayError: function (err) {
		this.client.emit("DisplayError", err);
	}
};

module.exports = function (http) {
	var server = SocketIO(http);
	server.on("connection", client => new BrowserClient(server, client));
};

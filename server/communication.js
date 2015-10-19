const SocketIO = require("socket.io");
const data     = require("./data");

function BrowserClient(server, client) {
	this.server = server;
	this.client = client;

	this.client.on("AddGroup",    this.onAddGroup.bind(this));
	this.client.on("ListGroups",  this.onListGroups.bind(this));
	this.client.on("DeleteGroup", this.onDeleteGroup.bind(this));
	this.client.on("RenameGroup", this.onRenameGroup.bind(this));
}

BrowserClient.prototype = {
	onListGroups: function () {
		var groups = [];

		for (var id in data.groups) {
			groups.push(data.groups[id].info);
		}

		this.client.emit("ListGroups", groups);
	},

	onAddGroup: function (name) {
		if (typeof(name) != "string" || name.length < 1)
			return;

		data.createGroup(name, function (err) {
			if (err) {
				this.displayError(err);
			} else {
				this.onListGroups();
				this.updateGroup();
			}
		}.bind(this));
	},

	onDeleteGroup: function (id) {
		if (typeof(id) != "number")
			return;

		data.deleteGroup(id, function (err) {
			if (err) {
				this.displayError(err);
			} else {
				this.onListGroups();
				this.updateGroup();
			}
		}.bind(this));
	},

	onRenameGroup: function (info) {
		if (typeof(info) != "object" || typeof(info.name) != "string" || typeof(info.id) != "number")
			return;

		data.renameGroup(info.id, info.name, function (err) {
			if (err) {
				this.displayError(err);
			} else {
				this.onListGroups();
				this.updateGroup();
			}
		}.bind(this));
	},

	updateGroup: function () {
		this.server.emit("UpdateGroup");
	},

	displayError: function (err) {
		this.client.emit("DisplayError", err);
	}
};

module.exports = function (http) {
	var server = SocketIO(http);
	server.on("connection", client => new BrowserClient(server, client));
};

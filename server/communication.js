"use strict";

const util     = require("./utilities");
const groups   = require("./groups");
const backends = require("./backends");

/**
 *
 */

function bindFunction(client, name, callback) {
	client.on(name, function (sink, ...args) {
		const self = {
			reply: (...retargs) => client.emit(name, sink, null, ...retargs),
			reject: reason => client.emit(name, sink, reason),
			__proto__: client
		};

		callback.call(self, ...args);
	});
}

/*
 * Brower controller
 */

class BrowserClient {
	constructor(client) {
		this.server = client.server;
		this.client = client;

		this.client.on("GetGroupInfo", this.onGetGroupInfo.bind(this));
		this.client.on("CreateGroup",  this.onCreateGroup.bind(this));
		this.client.on("RenameGroup",  this.onRenameGroup.bind(this));
		this.client.on("DeleteGroup",  this.onDeleteGroup.bind(this));

		this.client.on("ListBackends",  this.onListBackends.bind(this));
		this.client.on("RenameBackend", this.onRenameBackend.bind(this));
		this.client.on("DeleteBackend", this.onDeleteBackend.bind(this));
	}

	onGetGroupInfo(id) {
		const grp = groups.find(id);

		if (grp)
			this.client.emit("GetGroupInfo", {
				id: id,
				name: grp.name,
				parent: grp.parent,
				subGroups: grp.subGroups.map(g => ({id: g.id, name: g.name}))
			});
	}

	onCreateGroup(info) {
		if (typeof(info) != "object" || typeof(info.name) != "string" || (typeof(info.parent) != "number" && info.parent != null))
			return util.error("communication", "Invalid parameter to 'CreateGroup' directive", info);

		groups.create(info.name, info.parent).then(
			val => this.updateGroup(info.parent),
			err => this.displayError(err.message)
		);
	}

	onRenameGroup(info) {
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
	}

	onDeleteGroup(id) {
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
	}

	updateGroup(id) {
		this.server.emit("UpdateGroup", id);
	}

	updateGroupFailed(id, msg) {
		this.client.emit("UpdateGroupFailed", {
			id: id,
			message: msg
		});
	}

	onListBackends() {
		const list = [];

		backends.all.forEach((k, v) => {
			list.push({id: v.id, name: v.name});
		});

		this.client.emit("ListBackends", list);
	}

	onRenameBackend(info) {
		if (typeof(info) != "object" || typeof(info.name) != "string" || typeof(info.id) != "number")
			return util.error("communication", "Invalid parameter to 'RenameBackend' directive");

		const grp = backends.find(info.id);

		if (grp) {
			grp.rename(info.name).then(
				val => {
					this.updateBackend(grp.id);
					this.onListBackends();
				},
				err => this.updateBackendFailed(grp.id, err.message)
			);
		} else {
			util.error("communication", "Cannot find backend #" + info.id);
			this.displayError("Cannot find backend #" + info.id);
		}
	}

	onDeleteBackend(id) {
		if (typeof(id) != "number")
			return util.error("communication", "Invalid parameter to 'DeleteBackend' directive");

		const grp = backends.find(id);

		if (grp) {
			grp.delete().then(
				val => this.onListBackends(),
				err => this.updateBackendFailed(grp.id, err.message)
			);
		} else {
			util.error("communication", "Cannot find backend #" + id);
			this.displayError("Cannot find backend #" + id);
		}
	}

	updateBackend(id) {
		this.server.emit("UpdateBackend", id);
	}

	updateBackendFailed(id, msg) {
		this.client.emit("UpdateBackendFailed", {
			id: id,
			message: msg
		});
	}

	displayError(err) {
		this.client.emit("DisplayError", err);
	}
};

/*
 * Helpers
 */

function gatherGroupInfo(grp) {
	return {
		id: grp.id,
		name: grp.name,
		parent: grp.parent,
		subGroups: grp.subGroups.map(g => ({id: g.id, name: g.name}))
	};
}

/*
 * Exposed functions
 */

function getGroupInfo(id) {
	const grp = groups.find(id);

	if (grp) {
		this.reply(gatherGroupInfo(grp));
	} else {
		util.error("communication", "Cannot find group #" + id);
		this.reject({message: "A group with that ID does not exist"});
	}
}

function createGroup(name, parent) {
	if (typeof(name) != "string" || (typeof(parent) != "number" && parent != null)) {
		this.reject({message: "Error during group creation, check logs"});
		return util.error("communication", "Invalid parameters to 'createGroup'");
	}

	groups.create(name, parent).then(
		val => {
			this.emit("refreshGroup", val.parent);
			this.reply();
		},
		err => this.reject({message: err.message})
	);
}

function deleteGroup(id) {
	if (typeof(id) != "number") {
		this.reject({message: "Error during group deletion, check logs"});
		return util.error("communication", "Invalid parameter to 'deleteGroup'");
	}

	const grp = groups.find(id);

	if (grp) {
		grp.delete().then(
			val => {
				this.emit("refreshGroup", grp.parent);
				this.emit("deleteGroup", grp.id);
				this.reply();
			},
			err => this.reject({message: err.message})
		);
	} else {
		util.error("communication", "Cannot find group #" + id);
		this.reject({message: "Cannot find group #" + id});
	}
}

function renameGroup(id, name) {
	if (typeof(id) != "number" || typeof(name) != "string") {
		this.reject({message: "Error during group renaming, check logs"});
		return util.error("communication", "Invalid parameter to 'renameGroup'");
	}

	const grp = groups.find(id);

	if (grp) {
		grp.rename(name).then(
			val => {
				this.emit("refreshGroup", grp.parent);
				this.reply();
			},
			err => this.reject({message: err.message})
		);
	} else {
		util.error("communication", "Cannot find group #" + id);
		this.reject({message: "Cannot find group #" + id});
	}
}

/*
 * Setup
 */

module.exports = function (server) {
	server.on("connection", function (client) {
		new BrowserClient(client);

		bindFunction(client, "getGroupInfo", getGroupInfo);
		bindFunction(client, "createGroup",  createGroup);
		bindFunction(client, "deleteGroup",  deleteGroup);
		bindFunction(client, "renameGroup",  renameGroup);
	});
};

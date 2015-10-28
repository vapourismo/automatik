"use strict";

const util     = require("./utilities");
const groups   = require("./groups");
const backends = require("./backends");

/**
 * Utilities
 */

function bindFunction(client, name, callback) {
	name = "invoke:" + name;

	client.on(name, function (sink, ...args) {
		const self = {
			reply: (...retargs) => client.emit(name, sink, null, ...retargs),
			reject: reason => client.emit(name, sink, reason),
			trigger: (name, ...args) => client.server.emit("event:" + name, ...args)
		};

		callback.call(self, ...args);
	});
}

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
			this.trigger("refreshGroup", val.parent);
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
				console.log();
				this.trigger("refreshGroup", grp.parent);
				this.trigger("deleteGroup", id);
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
				this.trigger("refreshGroup", grp.parent);
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
		bindFunction(client, "getGroupInfo", getGroupInfo);
		bindFunction(client, "createGroup",  createGroup);
		bindFunction(client, "deleteGroup",  deleteGroup);
		bindFunction(client, "renameGroup",  renameGroup);
	});
};

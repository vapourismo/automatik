"use strict";

const util   = require("./utilities");
const groups = require("./groups");

/**
 * Utilities
 */

function bindFunction(client, name, callback) {
	name = "invoke:" + name;

	client.on(name, function (sink, ...args) {
		const self = {
			reply: (...retargs) => client.emit(name, sink, null, ...retargs),
			reject: reason => client.emit(name, sink, reason),
		};

		callback.call(self, ...args);
	});
}

function triggerEvent(server, channel, event, ...args) {
	server.to("channel:" + channel).emit("event:" + channel + ":" + event, ...args);
}

function bindEventSystem(client) {
	client.on("subscribe", function (channel) {
		client.join("channel:" + channel);
	});

	client.on("leave", function (channel) {
		client.leave("channel:" + channel);
	})
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

function triggerGroupEvent(server, gid, event, ...args) {
	triggerEvent(server, "group/" + gid, event, ...args);
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
		this.reject({message: "Cannot find group #" + id});
	}
}

function createGroup(name, parent) {
	if (typeof(name) != "string" || (typeof(parent) != "number" && parent != null)) {
		this.reject({message: "Error during group creation, check logs"});
		return util.error("communication", "Invalid parameters to 'createGroup'");
	}

	groups.create(name, parent).then(
		val => {
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
			val => this.reply(grp.name),
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

		bindEventSystem(client);
	});

	groups.events.on("attach", function (grp, mem) {
		triggerGroupEvent(server, grp.id, "refresh");
	});

	groups.events.on("detach", function (grp, mem) {
		triggerGroupEvent(server, grp.id, "refresh");
	});

	groups.events.on("delete", function (gid) {
		triggerGroupEvent(server, gid, "delete");
	});

	groups.events.on("rename", function (grp) {
		triggerGroupEvent(server, grp.parent, "refresh");
	});
};

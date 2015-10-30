"use strict";

class Channel {
	constructor(name, room) {
		this.name = name;
		this.room = room;

		this.methods = {};
	}

	register(name, callback) {
		this.methods[name] = callback;
	}

	send(method, ...args) {
		this.room.emit("route", this.name, method, ...args);
	}

	direct(client, method, ...args) {
		client.emit("route", this.name, method, ...args);
	}

	trigger(event, ...args) {
		this.send("trigger", event, ...args);
	}

	process(client, method, ...args) {
		switch (method) {
			case "invoke":
				this.processInvoke(client, ...args);

				break;
		}
	}

	processInvoke(client, sink, name, ...args) {
		if (!(name in this.methods))
			return;

		const reply  = answer => this.direct(client, "reply", sink, answer);
		const reject = reason => this.direct(client, "reject", sink, reason);

		this.methods[name](reply, reject, ...args);
	}
}

class Namespace {
	constructor(ns) {
		this.namespace = ns;
		this.channels = {};
		this.methods = {};

		this.namespace.on("connection", client => {
			client.on("route", (channel, ...args) => {
				if (!(channel in this.channels))
					return;

				this.channels[channel].process(client, ...args);
			});

			client.on("invoke", (sink, name, ...args) => {
				if (!(name in this.methods))
					return;

				const reply  = answer => client.emit("reply", sink, answer);
				const reject = reason => client.emit("reject", sink, reason);

				this.methods[name](reply, reject, ...args);
			});

			client.on("subscribe", channel => {
				client.join(channel);
			});

			client.on("unsubscribe", channel => {
				client.leave(channel);
			});
		});
	}

	create(name) {
		if (name in this.channels)
			return this.channels[name];
		else
			return this.channels[name] = new Channel(name, this.namespace.to(name));
	}

	register(name, callback) {
		this.methods[name] = callback;
	}
}

module.exports = Namespace;

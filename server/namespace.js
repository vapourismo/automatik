"use strict";

const EventEmitter = require("events");
const SocketIO     = require("socket.io");
const util         = require("./utilities");

/**
 * Socket.IO channel
 */
class Channel {
	constructor(name, ns) {
		this.name = name;
		this.namespace = ns;

		this.events = new EventEmitter();
		this.methods = {};
	}

	/**
	 * Register a function which can be invoked by clients.
	 * @param {String}   name     Function identifier
	 * @param {Function} callback Function with signature `(reply, reject, ...args)` where
	 *                            `reply` and `reject` shall be used to respond accordingly
	 */
	register(name, callback) {
		this.methods[name] = callback;
	}

	/**
	 * Trigger an event on every subscribed client.
	 * @param {String} event Event identifier
	 * @param {...*}   args  Event parameters
	 */
	trigger(event, ...args) {
		this.send("trigger", event, ...args);
	}

	/**
	 * Add an event handler.
	 * @param {String}   event    Event identifier
	 * @param {Function} callback Event handler
	 */
	on(event, callback) {
		this.events.on(event, callback);
	}

	/**
	 * Remove an event handler.
	 * @param {String}   event    Event identifier
	 * @param {Function} callback Event handler
	 */
	off(event, callback) {
		this.events.off(event, callback);
	}

	/**
	 * Remove this channel from the namespace. All registered functions and event handlers will be
	 * removed.
	 */
	destroy() {
		if (this.name in this.namespace.channels)
			delete this.namespace.channels[this.name];

		for (let key in this.methods)
			delete this.methods[key];

		this.events.removeAllListeners();
	}

	// Internals

	attach(client) {
		client.join(this.name);
	}

	detach(client) {
		client.leave(this.name);
	}

	send(method, ...args) {
		this.namespace.to(this.name).emit("route", this.name, method, ...args);
	}

	direct(client, method, ...args) {
		client.emit("route", this.name, method, ...args);
	}

	process(client, method, ...args) {
		switch (method) {
			case "invoke":
				this.processInvoke(client, ...args);
				break;

			case "trigger":
				this.processTrigger(client, ...args);
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

	processTrigger(client, event, ...args) {
		this.events.emit(event, ...args);
	}
}

/**
 * Socket.IO namespace
 */
class Namespace extends SocketIO {
	/**
	 * @constructor
	 */
	constructor() {
		super();

		this.channels = {};
		this.methods = {};

		this.on("connection", client => {
			client.on("error", error => {
				util.error("namespace", error instanceof Error ? error.stack : error);
			});

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
				if (!(channel in this.channels))
					return;

				this.channels[channel].attach(client);
			});

			client.on("unsubscribe", channel => {
				if (!(channel in this.channels))
					return;

				this.channels[channel].detach(client);
			});
		});
	}

	/**
	 * Create a new Channel.
	 * @param {String} name Channel identifier
	 * @returns {Channel}
	 */
	create(name) {
		if (name in this.channels)
			return this.channels[name];
		else
			return this.channels[name] = new Channel(name, this);
	}

	/**
	 * Register a function which can be invoked by clients.
	 * @param {String}   name     Function identifier
	 * @param {Function} callback Function with signature `(reply, reject, ...args)` where
	 *                            `reply` and `reject` shall be used to respond accordingly
	 */
	register(name, callback) {
		this.methods[name] = callback;
	}
}

module.exports = Namespace;

require("es6-promise").polyfill();

const Notifier = require("./notifier.jsx");

const network = io();

// Socket events
network.on("disconnect", () => Notifier.displayError("Lost connection to server"));
network.on("reconnect", () => Notifier.displayInfo("Successfully reconnected"));

class Channel {
	constructor(name, ns) {
		this.name = name;
		this.namespace = ns;

		this.callbacks = {};

		this.sinkCounter = 0;
		this.sinks = {};

		this.namespace.emit("subscribe", this.name);
	}

	on(event, callback) {
		if (event in this.callbacks)
			this.callbacks[event].push(callback);
		else
			this.callbacks[event] = [callback];
	}

	off(event, callback) {
		if (event in this.callbacks)
			this.callbacks[event] = this.callbacks[event].filter(f => f != callback);
	}


	send(method, ...args) {
		this.namespace.emit("route", this.name, method, ...args);
	}

	invoke(name, ...args) {
		return new Promise((reply, reject) => {
			const sink = this.sinkCounter++;
			const timeout = setTimeout(() => {
				this.reject(sink, new Error("Sink #" + sink + " timed out"));
			}, 10000);

			this.sinks[sink] = {reply, reject, timeout};
			this.send("invoke", sink, name, ...args);
		});
	}


	process(method, ...args) {
		switch (method) {
			case "trigger":
				this.trigger(...args);
				break;

			case "reply":
				this.reply(...args);
				break;

			case "reject":
				this.reject(...args);
				break;
		}
	}

	trigger(event, ...args) {
		if (!(event in this.callbacks))
			return;

		this.callbacks[event].forEach(function (callback) {
			setTimeout(() => callback(...args), 0);
		});
	}

	reply(sink, answer) {
		if (!(sink in this.sinks))
			return;

		clearTimeout(this.sinks[sink].timeout);
		this.sinks[sink].reply(answer);

		delete this.sinks[sink];
	}

	reject(sink, reason) {
		if (!(sink in this.sinks))
			return;

		clearTimeout(this.sinks[sink].timeout);
		this.sinks[sink].reject(reason);

		delete this.sinks[sink];
	}
}

class Namespace {
	constructor(ns) {
		this.namespace = ns;
		this.channels = {};

		this.namespace.on("route", (channel, ...args) => {
			if (!(channel in this.channels))
				return;

			this.channels[channel].process(...args);
		});
	}

	subscribe(name) {
		if (name in this.channels)
			return this.channels[name];
		else
			return this.channels[name] = new Channel(name, this.namespace);
	}
}

module.exports = new Namespace(network);

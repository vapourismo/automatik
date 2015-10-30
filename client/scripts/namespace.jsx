require("es6-promise").polyfill();

const Notifier = require("./notifier.jsx");

const network = io();

// Socket events
network.on("disconnect", function () {
	Notifier.displayError("Lost connection to server");
});

network.on("reconnect", function () {
	Notifier.displayInfo("Successfully reconnected");
});

class Channel {
	constructor(name, ns) {
		this.name = name;
		this.namespace = ns;
		this.subscribers = 0;

		this.callbacks = {};

		this.sinkCounter = 0;
		this.sinks = {};
	}

	subscribe() {
		this.namespace.emit("subscribe", this.name);
		this.subscribers++;
	}

	unsubscribe() {
		if (--this.subscribers == 0) {
			this.namespace.emit("unsubscribe", this.name);
			this.callbacks = {};
		}
	}

	resendSubscription() {
		if (this.subscribers > 0)
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
				this.processReject(sink, new Error("Sink #" + sink + " timed out"));
			}, 10000);

			this.sinks[sink] = {reply, reject, timeout};
			this.send("invoke", sink, name, ...args);
		});
	}

	process(method, ...args) {
		switch (method) {
			case "trigger":
				this.processTrigger(...args);
				break;

			case "reply":
				this.processReply(...args);
				break;

			case "reject":
				this.processReject(...args);
				break;
		}
	}

	processTrigger(event, ...args) {
		if (!(event in this.callbacks))
			return;

		this.callbacks[event].forEach(function (callback) {
			setTimeout(() => callback(...args), 0);
		});
	}

	processReply(sink, answer) {
		if (!(sink in this.sinks))
			return;

		clearTimeout(this.sinks[sink].timeout);
		this.sinks[sink].reply(answer);

		delete this.sinks[sink];
	}

	processReject(sink, reason) {
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

		this.namespace.on("reconnect", () => {
			for (let channel in this.channels)
				this.channels[channel].resendSubscription();
		});

		this.namespace.on("route", (channel, ...args) => {
			if (!(channel in this.channels))
				return;

			this.channels[channel].process(...args);
		});

		this.sinkCounter = 0;
		this.sinks = {};

		this.namespace.on("reply", (sink, answer) => {
			if (!(sink in this.sinks))
				return;

			clearTimeout(this.sinks[sink].timeout);
			this.sinks[sink].reply(answer);

			delete this.sinks[sink];
		});

		this.namespace.on("reject", (sink, reason) => {
			if (!(sink in this.sinks))
				return;

			clearTimeout(this.sinks[sink].timeout);
			this.sinks[sink].reject(reason);

			delete this.sinks[sink];
		});
	}

	subscribe(name) {
		if (name in this.channels) {
			const channel = this.channels[name];
			channel.subscribe();
			return channel;
		} else {
			const channel = this.channels[name] = new Channel(name, this.namespace);
			channel.subscribe();
			return channel
		}
	}

	with(name) {
		if (name in this.channels)
			return this.channels[name];
		else
			return this.channels[name] = new Channel(name, this.namespace);
	}

	invoke(name, ...args) {
		return new Promise((reply, reject) => {
			const sink = this.sinkCounter++;
			const timeout = setTimeout(() => {
				this.reject(sink, new Error("Sink #" + sink + " timed out"));
			}, 10000);

			this.sinks[sink] = {reply, reject, timeout};
			this.namespace.emit("invoke", sink, name, ...args);
		});
	}
}

module.exports = new Namespace(network);

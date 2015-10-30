"use strict";

const EventEmitter = require("events");
const knxclient    = require("knxclient");
const util         = require("../utilities");
const backends     = require("../backends");
const components   = require("../components");

class Datapoint extends backends.DatapointInterface {
	constructor(backend, address, value) {
		super();

		this.value = value;
		this.backend = backend;
		this.address = address;

		this.backend.hooks.on(this.address, this.listener = msg => {
			this.value = this.unwrap(msg);
			this.emit(this.value);
		});
	}

	delete() {
		this.backend.hooks.off(this.address, this.listener);
	}

	read() {
		return this.value;
	}

	write(value) {
		this.value = value;
		this.backend.client.send(0, this.address, this.wrap());
		this.emit(value);
	}

	unwrap(msg) {}
	wrap() {}
};

class Bool extends Datapoint {
	unwrap(msg) { return msg.asBool(); }
	wrap() { return knxclient.makeBool(this.value); }
}

class Float16 extends Datapoint {
	unwrap(msg) { return msg.asFloat16(); }
	wrap() { return knxclient.makeFloat16(this.value); }
}

class KNXRouter extends backends.Driver {
	constructor(config) {
		super();

		this.hooks = new EventEmitter();
		this.client = new knxclient.RouterClient(config);

		this.client.listen((sender, message) => {
			this.hooks.emit(message.destination, message);
		});
	}

	createInterface(value, config) {
		switch (config.type) {
			case 1: return new Bool(this, config.address, value);
			case 9: return new Float16(this, config.address, value);
		}
	}
}

backends.registerDriver(KNXRouter);

class Switch extends components.Type {
	constructor(channel, config, slots) {
		super();
		Object.assign(this, slots);

		this.channel = channel;
		this.config = config;

		this.channel.register("getCurrentValue", (reply, reject) => {
			reply(this.state.read());
		});

		this.status.listen(value => {
			this.channel.trigger("update", value);
		});
	}
}

components.registerType(Switch);

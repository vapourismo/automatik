"use strict";

const EventEmitter = require("events");
const knxclient    = require("knxclient");
const util         = require("../utilities");
const backends     = require("../backends");

class Datapoint extends backends.DatapointInterface {
	constructor(backend, address, value) {
		super();

		this.value = value;
		this.backend = backend;
		this.address = address;

		this.backend.hooks.on(this.address, this.listener = msg => {
			this.value = this.unpack(msg);
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
		this.backend.client.write(0, this.address, this.wrap());
		this.emit(value);
	}

	unpack(msg) {}
	wrap() {}
};

class Bool extends Datapoint {
	unpack(msg) { return knxclient.unpackBool(msg); }
	wrap() { return knxclient.packBool(this.value); }
}

class Float16 extends Datapoint {
	unpack(msg) { return knxclient.unpackFloat16(msg); }
	wrap() { return knxclient.packFloat16(this.value); }
}

class KNXRouter extends backends.Driver {
	constructor(config) {
		super();

		config = config || {};

		this.hooks = new EventEmitter();
		this.client = new knxclient.Router(config.host, config.port);

		this.client.on("indication", (src, dest, tpdu) => {
			if (tpdu.tpci != knxclient.NumberedData || tpdu.tpci != knxclient.UnnumberedData)
				return;

			if (tpdu.apci != knxclient.GroupValueResponse || tpdu.apci != knxclient.GroupValueWrite)
				return;

			this.hooks.emit(dest, tpdu.payload);
		});
	}

	createInterface(value, config) {
		switch (config.type) {
			case 1: return new Bool(this, config.address, value);
			case 9: return new Float16(this, config.address, value);
		}
	}
}

class KNXTunnel extends backends.Driver {
	constructor(config) {
		super();

		config = config || {};

		this.hooks = new EventEmitter();
		this.client = new knxclient.Tunnel(config.host, config.port);

		this.client.on("indication", (src, dest, tpdu) => {
			if (tpdu.tpci != knxclient.NumberedData || tpdu.tpci != knxclient.UnnumberedData)
				return;

			if (tpdu.apci != knxclient.GroupValueResponse || tpdu.apci != knxclient.GroupValueWrite)
				return;

			this.hooks.emit(dest, tpdu.payload);
		});

		this.client.connect();
	}

	createInterface(value, config) {
		switch (config.type) {
			case 1: return new Bool(this, config.address, value);
			case 9: return new Float16(this, config.address, value);
		}
	}
}

backends.registerDriver(KNXRouter);
backends.registerDriver(KNXTunnel);

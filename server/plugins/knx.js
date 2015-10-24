"use strict";

const EventEmitter  = require("events");
const knxclient     = require("knxclient");
const backends      = require("../backends");
const Communication = require("../communication");

class KNXRouter extends backends.Driver {
	constructor(config) {
		super();

		this.hooks = new EventEmitter();
		this.client = new knxclient.RouterClient(config);

		this.client.listen((sender, message) => {
			this.hooks.emit(message.destination, message);
		});
	}

	obtainDatapoint(config) {
		const obj = new backends.Datapoint();

		switch (config.type) {
			case 1:
				obj.on("commit", value => {
					this.client.send(0, config.address, knxclient.makeBool(value));
				});

				this.hooks.on(config.address, message => {
					obj.value = message.asBool();
				});

				break;

			case 9:
				obj.on("commit", value => {
					this.client.send(0, config.address, knxclient.makeFloat16(value));
				});

				this.hooks.on(config.address, message => {
					obj.value = message.asFloat16();
				});

				break;
		}

		return obj;
	}
}

backends.registerDriver(KNXRouter);

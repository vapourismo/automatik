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

	attachToDatapoint(config, datapoint) {
		switch (config.type) {
			case 1:
				datapoint.on("commit", value => {
					this.client.send(0, config.address, knxclient.makeBool(value));
				});

				this.hooks.on(config.address, message => {
					datapoint.value = message.asBool();
				});

				if (datapoint.value == null)
					datapoint.value = false;

				break;

			case 9:
				datapoint.on("commit", value => {
					this.client.send(0, config.address, knxclient.makeFloat16(value));
				});

				this.hooks.on(config.address, message => {
					datapoint.value = message.asFloat16();
				});

				if (datapoint.value == null)
					datapoint.value = 0.0;

				break;
		}
	}
}

backends.registerDriver(KNXRouter);

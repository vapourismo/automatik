"use strict";

const knxclient     = require("knxclient");
const backends      = require("../backends");
const Communication = require("../communication");

class KNXRouter extends backends.Driver {
	constructor(config) {
		super();

		this.client = new knxclient.RouterClient(config);
		this.datapoints = {};
	}

	obtainDatapoint(config) {

	}
}

backends.registerDriver(KNXRouter);

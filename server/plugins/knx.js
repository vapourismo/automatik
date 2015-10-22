"use strict";

const knxclient = require("knxclient");
const Driver    = require("../driver");

class KNXRouter extends Driver {
	constructor(config) {
		super();

		this.client = new knxclient.RouterClient(config);
		this.datapoints = {};
	}
}

Driver.register(KNXRouter);

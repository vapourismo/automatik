"use strict";

const knxclient     = require("knxclient");
const Driver        = require("../driver");
const Communication = require("../communication");

class KNXRouter extends Driver {
	constructor(config) {
		super();

		this.client = new knxclient.RouterClient(config);
		this.datapoints = {};
	}
}

Driver.register(KNXRouter);

// Communication.attachClientScript("/static/plugins/knx.js");
// Communication.attachClientStyle("/static/plugins/knx.css");

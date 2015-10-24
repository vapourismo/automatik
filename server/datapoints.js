"use strict";

const EventEmitter = require("events");
const backends     = require("./backends");
const util         = require("./utilities");
const db           = require("./database");

const datapoints = {};

class Datapoint extends EventEmitter {
	constructor() {
		super();
	}

	set value(value) {
		this._value = value;
		this.emit("update", value);
	}

	get value() {
		return this._value;
	}

	commit(value) {
		if (value !== undefined)
			this.value = value;

		this.emit("commit", this.value);
	}
}

class DatapointHandle {
	constructor(row) {
		Object.assign(this, row);

		const backend = backends.find(this.backend);
		if (!backend) throw new Error("Backend #" + this.backend + " does not exist");

		this.datapoint = new Datapoint();
		backend.attachToDatapoint(this.config, this.datapoint);
	}
}

module.exports = {
	load: function* () {
		const datapointsResult = yield db.queryAsync("SELECT * FROM datapoints");
		datapointsResult.rows.forEach(function (row) {
			util.inform("datapoints", "Registering '" + row.name + "'");
			datapoints[row.id] = new DatapointHandle(row);
		});
	}.async,

	find: function (id) {
		const datapoint = datapoints[id];
		return datapoint instanceof DatapointHandle ? datapoint : null;
	}
}

"use strict";

const EventEmitter = require("events");
const backends     = require("./backends");
const util         = require("./utilities");
const db           = require("./database");

const datapoints = {};

class Datapoint extends EventEmitter {
	constructor(value) {
		super();

		if (value !== undefined && value !== null)
			this.value = value;
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

		this.datapoint = new Datapoint(row.value);
		backend.attachToDatapoint(this.config, this.datapoint);

		this.datapoint.on("update", function* (value) {
			try {
				yield db.queryAsync("UPDATE datapints SET value = $1 WHERE id = $2", [value, row.id]);
			} catch (error) {
				util.error("datapoints", "Failed to update #" + row.id, error);
			}
		}.async);
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

	create: function* (name, backend, config, value) {
		// TODO: Validate parameters

		const insertResult = yield db.queryAsync("INSERT INTO datapoints (name, backend, config, value) VALUES ($1, $2, $3, $3)", [name, backend, config, value]);
		insertResult.rows.forEach(function (row) {
			util.inform("datapoints", "Registering '" + row.name + "'");
			datapoints[row.id] = new DatapointHandle(row);
		})
	}.async,

	find: function (id) {
		const datapoint = datapoints[id];
		return datapoint instanceof DatapointHandle ? datapoint : null;
	}
}

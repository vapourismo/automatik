"use strict";

const backends     = require("./backends");
const util         = require("./utilities");
const db           = require("./database");

const datapoints = {};

class Datapoint {
	constructor(row) {
		this.row = row;

		this.backend = backends.find(row.data.backend);
		if (!this.backend)
			throw new Error("Backend #" + row.data.backend + " does not exist");

		this.interface = this.backend.createInterface(row.data.value, row.data.config);
		this.interface.listen(value => {
			util.inform("datapoint: " + row.data.id, "value =", value);

			this.row.update({value: value}).catch(
				error => util.error("datapoints", "Failed to update #" + this.row.id, error)
			);
		});
	}

	get id() {
		return this.rows.data.id;
	}

	get name() {
		return this.rows.data.name;
	}

	get value() {
		return this.interface.read();
	}

	set value(value) {
		this.interface.write(value);
	}

	listen(callback) {
		this.interface.listen(callback);
	}

	mute(callback) {
		this.interface.mute(callback);
	}
}

const table = new db.Table("datapoints", "id", ["name", "backend", "config", "value"]);

module.exports = {
	load: function* () {
		const rows = yield table.load();
		rows.forEach(function (row) {
			util.inform("datapoint: " + row.data.id, "Registering '" + row.data.name + "'");
			datapoints[row.data.id] = new Datapoint(row);
		});
	}.async,

	create: function* (name, backend, config, value) {
		// TODO: Validate parameters

		const row = yield table.insert({name: name, backend: backend, config: config, value: value});

		util.inform("datapoint: " + row.data.id, "Registering '" + row.data.name + "'");
		datapoints[row.data.id] = new Datapoint(row);
	}.async,

	find: function (id) {
		const datapoint = datapoints[id];
		return datapoint instanceof DatapointHandle ? datapoint : null;
	}
}

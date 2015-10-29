"use strict";

const db       = require("./database");
const util     = require("./utilities");
const backends = require("./backends");

const datapoints = {};

class Datapoint {
	constructor(row) {
		this.row = row;

		this.backend = backends.find(row.data.backend);
		if (!this.backend)
			throw new Error("Backend #" + row.data.backend + " does not exist");

		this.interface = this.backend.createInterface(row.data.value, row.data.config);
		this.interface.listen(value => {
			this.row.update({value}).catch(
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

		const row = yield table.insert({name, backend, config, value});

		util.inform("datapoint: " + row.data.id, "Registering '" + row.data.name + "'");
		datapoints[row.data.id] = new Datapoint(row);
	}.async,

	find: function (id) {
		const datapoint = datapoints[id];
		return datapoint instanceof Datapoint ? datapoint : null;
	}
}

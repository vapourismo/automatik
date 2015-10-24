"use strict";

const EventEmitter = require('events');
const path         = require("path");
const db           = require("./database");
const util         = require("./utilities");

const drivers = {};
const backends = {};
const datapoints = {};

class Datapoint extends EventEmitter {
	constructor(value) {
		super();

		if (value !== undefined)
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

		this.emit("commit", value);
	}
}

class Driver {
	attachToDatapoint(config, datapoint) {
		throw new Error("Driver.attachToDatapoint is not implemented");
	}
}

class Backend {
	constructor(row) {
		Object.assign(this, row);

		if (!(this.driver in drivers))
			throw new Error("Driver '" + this.driver + "' does not exist");

		this.driver = new drivers[this.driver](this.config);
	}

	createDatapoint(config) {
		const dp = new Datapoint();
		this.driver.attachToDatapoint(config, dp);
		return dp;
	}
}

module.exports = {
	Driver: Driver,

	registerDriver: function (clazz) {
		const name = clazz.name;

		if (name in drivers)
			throw new Error("Driver '" + name + "' already exists");

		if (!(clazz.prototype instanceof Driver))
			throw new Error("Driver '" + name + "' needs to extend the Driver class");

		util.inform("drivers", "Registering '" + name + "'");
		drivers[name] = clazz;
	},

	load: function* () {
		const backendsResult = yield db.queryAsync("SELECT * FROM backends");
		backendsResult.rows.forEach(function (row) {
			util.inform("backends", "Registering '" + row.name + "'");
			backends[row.id] = new Backend(row);
		});

		const datapointsResult = yield db.queryAsync("SELECT * FROM datapoints");
		datapointsResult.rows.forEach(function (row) {
			if (!(row.backend in backends))
				throw new Error("Backend #" + row.backend + " does not exist");

			util.inform("datapoints", "Registering '" + row.name + "'");
			datapoints[row.id] = backends[row.backend].createDatapoint(row.config);
		});
	}.async,

	find: function (id) {
		const backend = backends[id];
		return backend instanceof Backend ? backend : null;
	}
};

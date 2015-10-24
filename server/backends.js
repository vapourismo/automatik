"use strict";

const path = require("path");
const util = require("./utilities");
const db   = require("./database");

const drivers = {};
const backends = {};

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

	attachToDatapoint(config, datapoint) {
		this.driver.attachToDatapoint(config, datapoint);
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
	}.async,

	create: function* (name, driver, config) {
		if (!(driver in drivers))
			throw new Error("Driver '" + this.driver + "' does not exist");

		const insertResult = yield db.queryAsync("INSERT INTO backends (name, driver, config) VALUES ($1, $2, $3) RETURNING *", [name, driver, config]);
		insertResult.rows.forEach(function (row) {
			util.inform("backends", "Registering '" + row.name + "'");
			backends[row.id] = new Backend(row);
		});
	}.async,

	find: function (id) {
		const backend = backends[id];
		return backend instanceof Backend ? backend : null;
	}
};

"use strict";

const path   = require("path");
const db     = require("./database");
const util   = require("./utilities");

const backends = {};
const drivers = {};

class Driver {
	obtainDatapoint(config) {
		throw new Error("Driver.obtainDatapoint is not implemented");
	}
}

class Backend {
	constructor(row) {
		Object.assign(this, row);

		if (!(this.driver in drivers))
			throw new Error("Driver '" + this.driver + "' does not exist");

		row.driver = new drivers[this.driver](this.config);
	}

	obtainDatapoint(config) {
		return row.driver.obtainDatapoint(config);
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

	find: function (id) {
		const backend = backends[id];
		return backend instanceof Backend ? backend : null;
	}
};

"use strict";

const path = require("path");
const util = require("./utilities");
const db   = require("./database");

const drivers = {};
const backends = {};

class BackendError extends Error {
	constructor(message, cause) {
		super(message);

		this.cause = cause;
	}
}

class Driver {
	attachToDatapoint(config, datapoint) {
		throw new Error("Driver.attachToDatapoint is not implemented");
	}
}

class Backend {
	constructor(row) {
		this.row = row;

		if (!(row.data.driver in drivers))
			throw new Error("Driver '" + row.data.driver + "' does not exist");

		this.driver = new drivers[row.data.driver](this.config);
	}

	get id() {
		return this.row.data.id;
	}

	get name() {
		return this.row.data.name;
	}

	get config() {
		return this.row.data.config;
	}

	attachToDatapoint(config, datapoint) {
		this.driver.attachToDatapoint(config, datapoint);
	}
}

Backend.prototype.rename = function* (name) {
	const tag = "backend: " + this.id;

	try {
		yield this.row.update({name: name});
		util.inform(tag, "Renamed to '" + this.name + "'");
	} catch (err) {
		util.error(tag, "Failed to rename", err);

		if (err.code == 23505 && err.constraint == "backends_name_key")
			throw new BackendError("A backend with that name already exists", err);
		else
			throw new BackendError("Unknown error, check logs", err);
	}
}.async;

Backend.prototype.delete = function* () {
	const tag = "backend: " + this.id;

	try {
		delete backends[this.id];
		yield this.row.delete();

		util.inform(tag, "Deleted '" + this.name + "'");
	} catch (err) {
		util.error(tag, "Failed to delete", err);

		if (err.code == 23503 && err.constraint == "datapoints_backend_fkey")
			throw new BackendError("There are datapoints attached to this backend", err);
		else
			throw new BackendError("Unknown error, check logs", err);
	}
}.async;

const table = new db.Table("backends", "id", ["name", "driver", "config"]);

module.exports = {
	Driver: Driver,
	all: backends,

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
		const rows = yield table.load();
		rows.forEach(function (row) {
			util.inform("backends", "Registering '" + row.data.name + "'");
			backends[row.data.id] = new Backend(row);
		});
	}.async,

	create: function* (name, driver, config) {
		if (!(driver in drivers))
			throw new Error("Driver '" + this.driver + "' does not exist");

		const row = yield table.insert({name: name, driver: driver, config: config});

		util.inform("backends", "Registering '" + row.name + "'");
		backends[row.id] = new Backend(row);
	}.async,

	find: function (id) {
		const backend = backends[id];
		return backend instanceof Backend ? backend : null;
	}
};

"use strict";
const EventEmitter = require("events");
const path         = require("path");
const util         = require("./utilities");
const db           = require("./database");

const drivers = {};
const backends = {};
const table = new db.Table("backends", "id", ["name", "driver", "config"]);

class BackendError extends Error {
	constructor(message, cause) {
		super(message);
		this.cause = cause;
	}
}

/**
 * Interface to a datapoint
 */
class DatapointInterface {
	/**
	 * @constructor
	 */
	constructor() {
		this._emitter = new EventEmitter();
	}

	/**
	 * Change the value.
	 * @internal Datapoint drivers must implement this.
	 * @param {*} value New value
	 */
	write(value) {
		throw new Error("DatapointInterface.write is not implemented");
	}

	/**
	 * Retrieve the value.
	 * @internal Datapoint drivers must implement this.
	 * @return {*} Value
	 */
	read() {
		throw new Error("DatapointInterface.read is not implemented");
	}

	/**
	 * Use this to notify listeners of changes to the value.
	 * @param {*} value New value
	 */
	emit(value) {
		this._emitter.emit("update", value);
	}

	/**
	 * Listen for changes to the value.
	 * @param {Function} callback Change handler
	 */
	listen(callback) {
		this._emitter.on("update", callback);
	}

	/**
	 * Stop listening for changes to the value.
	 * @param {Function} callback Previously registered change handler
	 */
	mute(callback) {
		this._emitter.off("update", callback);
	}

	/**
	 * Remove this datapoint.
	 * @internal Datapoint drivers may implement this.
	 */
	delete() {}
}

/**
 * Backend driver interface
 */
class Driver {
	/**
	 * Create an interface to a datapoint.
	 * @internal Backend drivers must implement this.
	 * @param {*} value  Previously recorded value
	 * @param {*} config Backend configuration
	 */
	createInterface(value, config) {
		throw new Error("Driver.createInterface is not implemented");
	}

	/**
	 * Delete this backend driver instance.
	 * @internal Backend drivers may implement this.
	 */
	delete() {}
}

/**
 * Backend handle
 */
class Backend {
	/**
	 * @constructor
	 * @param {Row} row Table row
	 */
	constructor(row) {
		this.row = row;

		if (!(row.data.driver in drivers))
			throw new Error("Driver '" + row.data.driver + "' does not exist");

		this.driver = new drivers[row.data.driver](this.config);
	}

	/**
	 * ID
	 * @type {Number}
	 */
	get id() {
		return this.row.data.id;
	}

	/**
	 * Name
	 * @type {String}
	 */
	get name() {
		return this.row.data.name;
	}

	/**
	 * Backend configuration
	 * @type {*}
	 */
	get config() {
		return this.row.data.config;
	}

	/**
	 * Create an interface to a datapoint.
	 * @param {*} value  Previously recorded value
	 * @param {*} config Backend configuration
	 * @returns {DatapointInterface}
	 */
	createInterface(value, config) {
		const iface = this.driver.createInterface(value, config);

		if (!(iface instanceof DatapointInterface))
			throw new Error("Backend driver '" + this.row.data.driver + "' returned an invalid datapoint interface");

		return iface;
	}

	// Documentation placeholders

	/**
	 * Rename this backend.
	 * @param {String} name New name
	 * @returns {Promise}
	 */
	rename(name) {}

	/**
	 * Remove this backend.
	 * @returns {Promise}
	 */
	delete() {}
}

Backend.prototype.rename = function* (name) {
	const tag = "backend: " + this.id;

	try {
		yield this.row.update({name});
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
		this.driver.delete();
		yield this.row.delete();

		delete backends[this.id];

		util.inform(tag, "Deleted '" + this.name + "'");
	} catch (err) {
		util.error(tag, "Failed to delete", err);

		if (err.code == 23503 && err.constraint == "datapoints_backend_fkey")
			throw new BackendError("There are datapoints attached to this backend", err);
		else
			throw new BackendError("Unknown error, check logs", err);
	}
}.async;

/**
 * Register a backend driver. The name of the given class determines the driver identifier.
 * @param {Object} clazz Backend driver class
 */
function registerDriver(clazz) {
	const name = clazz.name;

	if (name in drivers)
		throw new Error("Driver '" + name + "' already exists");

	if (!(clazz.prototype instanceof Driver))
		throw new Error("Driver '" + name + "' needs to extend the Driver class");

	util.inform("drivers", "Registering '" + name + "'");
	drivers[name] = clazz;
}

/**
 * Load all backends.
 * @returns {Promise<Array<Backend>>} All loaded backends
 */
const load = function* () {
	const rows = yield table.load();
	return rows.map(function (row) {
		util.inform("backend: " + row.data.id, "Registering '" + row.data.name + "'");
		return backends[row.data.id] = new Backend(row);
	});
}.async

/**
 * Create a new backend.
 * @param {String} name   Backend name
 * @param {String} driver Driver identifier
 * @param {*}      config Backend configuration
 */
const create = function* (name, driver, config) {
	if (!(driver in drivers))
		throw new Error("Driver '" + this.driver + "' does not exist");

	const row = yield table.insert({name, driver, config});

	util.inform("backend: " + row.data.id, "Registering '" + row.data.name + "'");
	backends[row.data.id] = new Backend(row);
}.async

/**
 * Find a backend using its ID.
 * @returns {Backend} Matching backend or null if the backend could not be found
 */
function find(id) {
	const backend = backends[id];
	return backend instanceof Backend ? backend : null;
}

module.exports = {
	Driver,
	DatapointInterface,
	registerDriver,
	load,
	create,
	find
};

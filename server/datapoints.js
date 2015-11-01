"use strict";

const db       = require("./database");
const util     = require("./utilities");
const backends = require("./backends");

const datapoints = {};
const table = new db.Table("datapoints", "id", ["name", "backend", "config", "value"]);

/**
 * Datapoint handle
 */
class Datapoint {
	/**
	 * @constructor
	 * @param {Row} row Table row
	 */
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

	/**
	 * ID
	 * @type {Number}
	 */
	get id() {
		return this.rows.data.id;
	}

	/**
	 * Name
	 * @type {String}
	 */
	get name() {
		return this.rows.data.name;
	}
}

/**
 * Load all datapoints. It is imperative that backends are loaded beforehand.
 * @returns {Promise<Array<Datapoint>>} All loaded datapoints
 */
const load = function* () {
	const rows = yield table.load();
	rows.forEach(function (row) {
		util.inform("datapoint: " + row.data.id, "Registering '" + row.data.name + "'");
		datapoints[row.data.id] = new Datapoint(row);
	});
}.async;

/**
 * Create a new datapoint.
 * @param {String} name    Datapoint name
 * @param {Number} backend Backend ID
 * @param {*}      config  Datapoint configuration
 * @param {*}      value   Initial value
 * @returns {Promise<Datapoint>} Newly created datapoint
 */
const create = function* (name, backend, config, value) {
	if (!backends.find(backend))
		throw new Error("Cannot find backend #" + backend);

	const row = yield table.insert({name, backend, config, value});

	util.inform("datapoint: " + row.data.id, "Registering '" + row.data.name + "'");
	datapoints[row.data.id] = new Datapoint(row);
}.async;

/**
 * Find a datapoint using its ID.
 * @returns {Datapoint} Matching datapoint or null if it could not be found
 */
const find = function (id) {
	const datapoint = datapoints[id];
	return datapoint instanceof Datapoint ? datapoint : null;
};

module.exports = {
	load,
	create,
	find
};

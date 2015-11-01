"use strict";

const db         = require("./database");
const util       = require("./utilities");
const groups     = require("./groups");
const datapoints = require("./datapoints");

const types = {};
const components = {};

/**
 * Interface for a type which drives a component
 */
class Type {}

/**
 * Component handle
 */
class Component {
	/**
	 * @constructor
	 * @param {Namespace} ns Root namespace
	 * @param {Row} row Database row
	 */
	constructor(ns, row) {
		this.namespace = ns;
		this.channel = ns.create("component/" + row.data.id);
		this.row = row;

		if (!(row.data.type in types))
			throw new Error("Type '" + row.data.type + "' does not exist");

		// Load slots for the underlying component type
		(function* () {
			const slotsResult = yield db.queryAsync(
				"SELECT name, datapoint FROM slots WHERE component = $1",
				[row.data.id]
			);

			const slots = {};
			slotsResult.rows.forEach(function (slot) {
				const datapoint = datapoints.find(slot.datapoint);

				if (!datapoint)
					throw new Error("Datapoint #" + slot.datapoint + " does not exist");

				slots[slot.name] = datapoint.interface;
			});

			this.instance = new types[row.data.type](this.channel, row.data.config, slots);
		}.async).call(this).catch(function (error) {
			util.error("component: " + row.data.id, "Error while loading slots", error.stack);
		});

		const parent = groups.find(this.row.data.parent);
		if (parent)
			parent.attachComponent(this);
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
	 * Type identifier
	 * @type {String}
	 */
	get type() {
		return this.row.data.type;
	}
}

/**
 * Register a new Type class. The name of the given class determines the registered type identifier.
 * @param {Object} clazz Type class
 */
function registerType(clazz) {
	const name = clazz.name;

	if (name in types)
		throw new Error("Type '" + name + "' already exists");

	if (!(clazz.prototype instanceof Type))
		throw new Error("Type '" + name + "' needs to extend the Type class");

	util.inform("types", "Registering '" + name + "'");
	types[name] = clazz;
}

const table = new db.Table("components", "id", ["name", "parent", "type", "config"]);

/**
 * Load all components. It is important that groups and datapoints are already loaded, when you call
 * this function.
 * @param {Namespace} ns
 */
const load = function* (ns) {
	const rows = yield table.load();
	rows.forEach(function (row) {
		util.inform("component: " + row.data.id, "Registering '" + row.data.name + "'");
		components[row.data.id] = new Component(ns, row);
	});
}.async;

module.exports = {
	Type,
	registerType,
	load
};

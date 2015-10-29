"use strict";

const db         = require("./database");
const util       = require("./utilities");
const datapoints = require("./datapoints");

const types = {};
const components = {};

class Type {

}

class Component {
	constructor(row) {
		this.row = row;

		if (!(row.data.type in types))
			throw new Error("Type '" + row.data.type + "' does not exist");

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

			this.instance = new types[row.data.type](row.data.config, slots);
		}.async).call(this).catch(function (error) {
			util.error("component: " + row.data.id, "Error while loading slots", error.stack);
		});
	}

	get id() {
		return this.row.data.id;
	}

	get name() {
		return this.row.data.name;
	}
};

const table = new db.Table("components", "id", ["name", "parent", "type", "config"]);

module.exports = {
	Type,

	registerType(clazz) {
		const name = clazz.name;

		if (name in types)
			throw new Error("Type '" + name + "' already exists");

		if (!(clazz.prototype instanceof Type))
			throw new Error("Type '" + name + "' needs to extend the Type class");

		util.inform("types", "Registering '" + name + "'");
		types[name] = clazz;
	},

	load: function* () {
		const rows = yield table.load();
		rows.forEach(function (row) {
			util.inform("component: " + row.data.id, "Registering '" + row.data.name + "'");
			components[row.data.id] = new Component(row);
		});
	}.async
};

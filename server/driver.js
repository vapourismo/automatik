"use strict";

const util = require("./utilities");

class Driver {
	obtainDatapoint(config) {
		throw new Error("Driver.obtainDatapoint is not implemented");
	}

	static register(clazz) {
		const name = clazz.name;

		if (name in this.drivers)
			throw new Error("Driver '" + name + "' already exists");

		if (!(clazz.prototype instanceof Driver))
			throw new Error("Driver '" + name + "' needs to extend the Driver class");

		util.inform("drivers", "Registering '" + name + "'");
		this.drivers[name] = clazz;
	}

	static create(name, config) {
		if (!(name in this.drivers))
			throw new Error("Driver '" + name + "' does not exist");

		return new this.drivers[name](config);
	}
}

Driver.drivers = {};

module.exports = Driver;

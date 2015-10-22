const util = require("./utilities");

const DriverPrototype = {
	configure: function (config) {}
};

const drivers = {};

module.exports = {
	register: function (name, spec) {
		if (name in drivers)
			throw new Error("Driver '" + name + "' already exists");

		util.inform("drivers", "Registering '" + name + "'");
		drivers[name] = Object.assign(Object.create(DriverPrototype), spec);
	},

	create: function (name, config) {
		if (!(name in drivers))
			throw new Error("Driver '" + name + "' does not exist");

		const inst = Object.create(drivers[name]);
		inst.configure(config);

		return inst;
	},

	all: drivers
};

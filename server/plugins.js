const path     = require("path");
const util     = require("./utilities");
const wrappers = require("./wrappers");

const drivers = {};

// Every plugin's initialization function will be bound to this environment
const pluginEnvironment = {
	registerDriver: function (name, spec) {
		const tag = "driver: " + name;

		// This check might be removed in future version
		if (name in drivers)
			return util.error("drivers", "Driver '" + name + "' already exists");

		util.inform("drivers", "Registering driver '" + name + "'");
		drivers[name] = wrappers.createDriver(spec);
	}
};

// Traverse 'plugins/' directory and load each file
const pluginDirectory = path.join(path.dirname(module.filename), "plugins");
util.iterateFiles(pluginDirectory, function (file) {
	// Do not load junk
	if (path.extname(file) != ".js")
		return;

	util.inform("plugins", "Loading '" + path.relative(pluginDirectory, file) + "' ...");
	const mod = require(file);

	// Plugins must export an initialization function
	if (mod instanceof Function)
		mod.call(Object.create(pluginEnvironment));
	else
		util.error(tag, "Plugin does not export a function");
});

module.exports = {
	instantiateDriver: function (name, config) {
		if (!(name in drivers))
			throw new Error("Driver '" + name + "' does not exist");

		// Instantiate and configure manually, because drivers aren't traditional classes
		const inst = Object.create(drivers[name]);
		inst.configure(config);

		return inst;
	}
};

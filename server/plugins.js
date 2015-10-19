const path = require("path");
const util = require("./utilities");

const pluginDirectory = path.join(path.dirname(module.filename), "plugins");
const drivers = {};

util.iterateFiles(pluginDirectory, function (file) {
	if (path.extname(file) != ".js")
		return;

	const fileIdentifier = path.relative(pluginDirectory, file);
	const mod = require(file);

	// Has backend drivers
	if (mod.drivers) {
		for (var id in mod.drivers) {
			const driver = mod.drivers[id];

			util.inform("plugin: " + fileIdentifier, "Loaded driver '" + driver.meta.name + "'");
			drivers[id] = driver;
		}
	}
});

module.exports = {
	instantiateDriver: function (name, conf) {
		return name in drivers ? new drivers[name](conf) : null;
	}
};

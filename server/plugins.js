const path = require("path");
const util = require("./utilities");

const drivers = {};

const pluginDirectory = path.join(path.dirname(module.filename), "plugins");
util.iterateFiles(pluginDirectory, function (file) {
	if (path.extname(file) != ".js")
		return;

	const tag = "plugin: " + path.relative(pluginDirectory, file);
	const mod = require(file);

	// Has backend drivers
	if (mod.drivers) {
		for (var id in mod.drivers) {
			var driver = mod.drivers[id];

			if (!(driver instanceof Object)) {
				util.error(tag, "Driver '" + id + "' is not an Object");
				continue;
			}

			util.inform(tag, "Loaded driver '" + driver.name + "'");
			drivers[id] = driver;
		}
	}
});

module.exports = {
	drivers: drivers
};

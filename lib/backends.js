var path = require("path");
var util = require("./utilities");

function loadDrivers(base) {
	var drivers = {};

	util.iterateFiles(base, function (file) {
		var driver = require(file);

		drivers[driver.meta.id] = driver;
		console.log("Loaded backend driver '" + driver.meta.name + "' (" + driver.meta.id + ")");
	});

	return drivers;
}

module.exports = loadDrivers(path.join(path.dirname(module.filename), "backends"));

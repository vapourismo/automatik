var fs = require("fs");
var path = require("path");

function loadDrivers(base) {
	var drivers = {};

	fs.readdirSync(base).forEach(function (entry) {
		var file = path.join(base, entry);
		if (!fs.statSync(file).isFile())
			return;

		var name = path.basename(entry, path.extname(entry));
		var driver = require(file);

		drivers[name] = driver;
		console.log("Loaded backend driver '" + driver.meta.name + "' (" + name + ")");
	});

	return drivers;
}

module.exports = loadDrivers(path.join(path.dirname(module.filename), "backends"));

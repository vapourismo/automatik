var path = require("path");
var util = require("./utilities");

function loadDrivers(base) {
	var drivers = {};

	util.iterateFiles(base, function (file) {
		var mod = require(file);

		for (var id in mod) {
			console.log("Loaded backend driver '" + mod[id].meta.name + "' (" + id + ")");
			drivers[id] = mod[id];
		}
	});

	return drivers;
}

module.exports = loadDrivers(path.join(path.dirname(module.filename), "backends"));

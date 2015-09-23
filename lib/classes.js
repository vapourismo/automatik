var path = require("path");
var util = require("./utilities");

function loadClasses(base) {
	var classes = {};

	util.iterateFiles(base, function (file) {
		var mod = require(file);

		for (var id in mod) {
			console.log("Loaded class '" + mod[id].meta.name + "' (" + id + ")");
			classes[id] = mod[id];
		}
	});

	return classes;
}

module.exports = loadClasses(path.join(path.dirname(module.filename), "classes"));

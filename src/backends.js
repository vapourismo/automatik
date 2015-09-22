var fs = require("fs");
var db = require("./database.js");

const backendPathRegex = /(.*)\.js$/;

var drivers = {}
var instances = {};

// Iterate over every file in "backends"
fs.readdir("./src/backends", function (err, files) {
	if (err) {
		console.error("Failed to list backends", err);
		process.exit(1);
		return;
	}

	files.map(function (path) {
		if (backendPathRegex.test(path) && fs.statSync("./src/backends/" + path).isFile()) {
			var name = backendPathRegex.exec(path)[1];

			console.log("Loading backend driver '" + name + "'")
			drivers[name] = require("./backends/" + path);
		}
	});

	db.query("SELECT id, name, driver, config FROM backends", function (err, result) {
		if (err) {
			console.error("Failed to fetch backend instances", err);
			process.exit(1);
			return;
		}

		result.rows.map(function (backend) {
			console.log("Instantiating backend '" + backend.name + "' (" + backend.driver + "/" +
			            backend.id + ")");

			if (backend.driver in drivers) {
				instances[backend.id] = new drivers[backend.driver](backend.config);
			} else {
				console.warn("Request backend driver '" + backend.driver + "' does not exist");
			}
		});
	});
});

module.exports = {
	drivers: drivers,
	instances: instances
};

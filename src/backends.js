var fs = require("fs");
var db = require("./database.js");

const backendPathRegex = /(.*)\.js$/;

var drivers = {};
var backends = {};
var datapoints = {};

function instantiateDatapoint(backend, info) {
	console.log("Configuring datapoint '" + info.name + "' (" + info.id + ")");

	var datapoint = backend.configure(info.config);
	if (datapoint) datapoints[info.id] = datapoint;
	else console.warn("Datapoint '" + info.name + "' (" + info.id + ") failed to configure");
}

function instantiateDatapoints(backend, backendID) {
	db.query(
		"SELECT id, name, config FROM datapoints WHERE backend = $1",
		[backendID],
		function (err, result) {
			if (err) {
				console.error("Failed to fetch datapoints");
				process.exit(1);
				return;
			}

			result.rows.forEach(instantiateDatapoint.bind(null, backend));
		}
	);
}

function instantiateBackend(info) {
	console.log("Instantiating backend '" + info.name + "' (" + info.id + ")");

	if (info.driver in drivers) {
		var backend = new drivers[info.driver](info.config);
		backends[info.id] = backend;
		instantiateDatapoints(backend, info.id);
	} else {
		console.warn("Requested backend driver '" + info.driver + "' does not exist");
	}
}

// Iterate over every file in "drivers"
fs.readdir("./src/drivers", function (err, files) {
	if (err) {
		console.error("Failed to list backend drivers", err);
		process.exit(1);
		return;
	}

	files.forEach(function (path) {
		if (backendPathRegex.test(path) && fs.statSync("./src/drivers/" + path).isFile()) {
			var name = backendPathRegex.exec(path)[1];

			console.log("Loading backend driver '" + name + "'");
			drivers[name] = require("./drivers/" + path);
		}
	});

	db.query("SELECT id, name, driver, config FROM backends", function (err, result) {
		if (err) {
			console.error("Failed to fetch backends", err);
			process.exit(1);
			return;
		}

		result.rows.forEach(instantiateBackend);
	});
});

module.exports = {
	drivers: drivers,
	backends: backends,
	datapoints: datapoints
};

var path = require("path");
var util = require("./utilities");
var db = require("./database");

const drivers = {};
const backends = {};
const datapoints = {};

util.iterateFiles(path.join(path.dirname(module.filename), "backends"), function (file) {
	if (path.extname(file) != ".js")
		return;

	var mod = require(file);

	for (var id in mod) {
		console.log("Loaded backend driver '" + mod[id].meta.name + "' (" + id + ")");
		drivers[id] = mod[id];
	}
});

function loadBackends(callback) {
	db.query("SELECT * FROM backends", function (err, result) {
		if (err) {
			console.error("Failed to fetch backend instances");
			process.exit(1);
			return;
		}

		result.rows.forEach(function (row) {
			if (row.driver in drivers) {
				backends[row.id] = new drivers[row.driver](row.config);
				console.log("Instantiated backend '" + row.name + "'");
			} else {
				console.warn("Backend '" + row.name + "': Driver '" + row.driver + "' does not exist");
			}
		});

		if (callback) callback(backends);
	});
}

function loadDatapoints(callback) {
	db.query("SELECT * FROM datapoints", function (err, result) {
		if (err) {
			console.error("Failed to fetch datapoint instances");
			process.exit(1);
			return;
		}

		result.rows.forEach(function (row) {
			if (row.backend in backends) {
				var dp = backends[row.backend].configureDatapoint(row.config, row.value);

				if (dp) {
					datapoints[row.id] = dp;
					console.log("Configured datapoint '" + row.name + "'");

					dp.listen(function (newValue) {
						db.query("UPDATE datapoints SET value = $1 WHERE id = $2", [newValue, row.id]);
					});
				} else {
					console.warn("Datapoint '" + row.name + "': Failed to configure");
				}
			} else {
				console.warn("Datapoint '" + row.name + "': Backend instance with ID " + row.backend + " does not exist");
			}
		});

		if (callback) callback(datapoints);
	});
}

function loadAll(callback) {
	loadBackends(function () {
		loadDatapoints(function () {
			if (callback) callback(backends, datapoints);
		});
	});
}

module.exports = {
	drivers: drivers,
	backends: backends,
	datapoints: datapoints,
	loadBackends: loadBackends,
	loadDatapoints: loadDatapoints,
	loadAll: loadAll
};

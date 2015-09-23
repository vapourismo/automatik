var tpls = require("./lib/templates");
var backends = require("./lib/backends");
var classes = require("./lib/classes");

var db = require("./src/database.js");

var backendInstances = {};

db.query("SELECT id, name, driver, config FROM backends", function (err, result) {
	if (err) {
		console.error("Failed to fetch backend instances");
		process.exit(1);
		return;
	}

	result.rows.forEach(function (row) {
		if (row.driver in backends) {
			backendInstances[row.id] = new backends[row.driver](row.config);
			console.log("Instantiated backend '" + row.name + "'");
		} else {
			console.warn("Backend '" + row.name + "': Driver '" + row.driver + "' does not exist");
		}
	});
});

var datapointInstances = {};

db.query("SELECT id, name, backend, config, value FROM datapoints", function (err, result) {
	if (err) {
		console.error("Failed to fetch datapoint instances");
		process.exit(1);
		return;
	}

	result.rows.forEach(function (row) {
		if (row.backend in backendInstances) {
			var dp = backendInstances[row.backend].configureDatapoint(row.config, row.value);

			if (dp) {
				datapointInstances[row.id] = dp;
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
});

var entityInstances = {};

db.query("SELECT id, name, type, config FROM entities", function (err, result) {
	if (err) {
		console.error("Failed to fetch entity instances");
		process.exit(1);
		return;
	}

	result.rows.forEach(function (row) {
		if (row.type in classes) {
			db.query(
				"SELECT name, value FROM slots s WHERE entity = $1",
				[row.id],
				function (err2, result2) {
					if (err2) {
						console.warn("Entity '" + row.name + "': Failed to fetch slots");
						return;
					}

					var slots = {};
					result2.rows.forEach(function (row2) {
						if (row2.value in datapointInstances) {
							slots[row2.name] = datapointInstances[row2.value];
						} else {
							console.warn("Entity '" + row.name + "': Slot '" + row2.name + "': Datapoint with ID" + row2.value + " does not exist");
						}
					});

					entityInstances[row.id] = new classes[row.type](row.conf, slots);
					console.log("Instantiated entity '" + row.name + "'");
				}
			);
		} else {
			console.warn("Entity '" + row.name + "': Type " + row.type + " does not exist");
		}
	});
});

// var types = require("./src/types.js");
// var server = require("./src/server.js");


// const info = {
// 	title: "automatik",
// 	version: "0.0.0"
// };

// server.express.get("/", (req, res) => res.redirect("/rooms"));

// server.express.get("/rooms", function (req, res) {
// 	db.query("SELECT id, name FROM rooms ORDER BY name ASC", function (err, result) {
// 		if (err) {
// 			// TODO: Handle query errors
// 			res.status(500).json(err);
// 		} else {
// 			res.send(tpls.overview({
// 				info: info,
// 				rooms: result.rows.map(tpls.boxes.room)
// 			}));
// 		}
// 	});
// });

// server.express.get("/rooms/settings", (req, res) => res.redirect("/rooms"));

// server.express.get("/rooms/:id", function (req, res) {
// 	db.query(
// 		"SELECT c.id, c.name, d.id AS datapoint, c.type FROM components c, datapoints d WHERE c.room = $1 AND c.datapoint = d.id",
// 		[req.params.id],
// 		function (err, result) {
// 			if (err) {
// 				// TODO: Handle query errors
// 				res.status(500).json(err);
// 			} else {
// 				res.send(tpls.room({
// 					info: info,
// 					room: req.params.id,
// 					components: result.rows.map(function (component) {
// 						var value = datapoints[component.datapoint].read();

// 						if (value != null && component.type in types) {
// 							component.value = types[component.type].renderValue(value);
// 						}

// 						return tpls.boxes.component(component);
// 					})
// 				}));
// 			}
// 		}
// 	);
// });

// server.express.get("/rooms/:id/settings", (req, res) => res.redirect("/rooms/" + req.params.id));

// server.http.listen(3001);

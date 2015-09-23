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
			console.log("Instantiated backend '" + row.name + "' (" + row.id + ")");
		} else {
			console.warn("Failed to instantiate backend '" + row.name + "': Backend driver '" + row.driver + "' does not exist");
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
				console.log("Instantiated datapoint '" + row.name + "' (" + row.id + ")");
			} else {
				console.warn("Failed to configure datapoint '" + row.name + "'");
			}
		} else {
			console.warn("Failed to instantiate datapoint '" + row.name + "': Backend instance with ID " + row.backend + " does not exist");
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

var db = require("./database.js");
var tpl = require("./templates.js");
var types = require("./types.js");
var backends = require("./backends.js");
var server = require("./server.js");

const info = {
	title: "automatik",
	version: "0.0.0"
};

server.express.get("/", (req, res) => res.redirect("/rooms"));

server.express.get("/rooms", function (req, res) {
	db.query("SELECT id, name FROM rooms ORDER BY name ASC", function (err, result) {
		if (err) {
			// TODO: Handle query errors
			res.status(500).json(err);
		} else {
			res.send(tpl.overview({
				info: info,
				rooms: result.rows.map(tpl.boxes.room)
			}));
		}
	});
});

server.express.get("/rooms/settings", (req, res) => res.redirect("/rooms"));

server.express.get("/rooms/:id", function (req, res) {
	db.query(
		"SELECT c.id, c.name, d.id AS datapoint, c.type FROM components c, datapoints d WHERE c.room = $1 AND c.datapoint = d.id",
		[req.params.id],
		function (err, result) {
			if (err) {
				// TODO: Handle query errors
				res.status(500).json(err);
			} else {
				res.send(tpl.room({
					info: info,
					room: req.params.id,
					components: result.rows.map(function (component) {
						var value = backends.datapoints[component.datapoint].read();

						if (value != null && component.type in types) {
							component.value = types[component.type].renderValue(value);
						}

						return tpl.boxes.component(component);
					})
				}));
			}
		}
	);
});

server.express.get("/rooms/:id/settings", (req, res) => res.redirect("/rooms/" + req.params.id));

server.sockio.on("connection", function (client) {
	var hooks = [];

	client.on("request-component-updates", function (msg) {
		var inStmt = []
		for (var i = 0; i < msg.length; i++) {
			inStmt.push("$" + (i + 1));
		}

		db.query(
			"SELECT id, type, datapoint FROM components WHERE id IN (" + inStmt.join(", ") + ")",
			msg,
			function (err, result) {
				if (err) {
					console.error(err);
					return;
				}

				result.rows.forEach(function (component) {
					if (!(component.type in types) || !backends.datapoints[component.datapoint])
						return;

					var dp = backends.datapoints[component.datapoint];
					var hook = function (dp, value) {
						client.emit("update-component", {
							id: component.id,
							value: types[component.type].renderValue(value)
						});
					};

					hooks.push({datapoint: dp, hook: hook});
					dp.listen(hook);
				});
			}
		);
	});

	client.on("disconnect", function () {
		hooks.forEach(function (info) {
			info.datapoint.mute(info.hook);
		});

		hooks = [];
	});
});

server.http.listen(3001);

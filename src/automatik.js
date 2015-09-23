var web = require("express")();
var db = require("./database.js");
var tpl = require("./templates.js");
var types = require("./types.js");
var backends = require("./backends.js");

const info = {
	title: "automatik",
	version: "0.0.0"
};

web.get("/", (req, res) => res.redirect("/rooms"));

web.get("/rooms", function (req, res) {
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

web.get("/rooms/settings", (req, res) => res.redirect("/rooms"));

web.get("/rooms/:id", function (req, res) {
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

						if (value && component.type in types) {
							component.value = types[component.type].renderValue(value);
						}

						return component;
					})
				}));
			}
		}
	);
});

web.get("/rooms/:id/settings", (req, res) => res.redirect("/rooms/" + req.params.id));

web.listen(3001);

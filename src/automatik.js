var pg = require("pg");
var web = require("express")();
var tpl = require("./templates.js");

var db = new pg.Client({
	host: "localhost",
	user: "ole",
	database: "ole"
});

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
				minor: result.rows.map(tpl.boxes.minor)
			}));
		}
	});
});

web.get("/rooms/settings", (req, res) => res.redirect("/rooms"));

web.get("/rooms/:id", function (req, res) {
	db.query(
		"SELECT id, name FROM rooms WHERE id = $1",
		[req.params.id],
		function (err, result) {
			if (err) {
				// TODO: Handle query errors
				res.status(500).json(err);
			} else if (result.rows[0]) {
				var room = result.rows[0];

				res.send(tpl.room({
					info: info,
					room: room
				}));
			} else {
				res.status(404).end();
			}
		}
	);
});

web.get("/rooms/:id/settings", (req, res) => res.redirect("/rooms/" + req.params.id));

db.connect();
web.listen(3001);

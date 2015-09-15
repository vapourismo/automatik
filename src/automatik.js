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

web.get("/", function (req, res) {
	db.query("SELECT short_name, name FROM rooms ORDER BY name ASC", function (err, result) {
		if (err) {
			// TODO: Handle query errors
			res.status(500).json(err);
		} else {
			res.send(tpl.overview({
				info: info,
				major: [],
				minor: result.rows.map(tpl.boxes.room)
			}));
		}
	});
});

web.get("/rooms/:shortname", function (req, res) {
	res.redirect("/");
});

db.connect();
web.listen(3001);

var http = require("http");
var bodyparser = require("body-parser");
var Express = require("express");

var tpls = require("./lib/templates");
var backends = require("./lib/backends");
var entities = require("./lib/entities");
var communication = require("./lib/communication");

const info = {
	title: "automatik",
	version: "0.0.0"
};

var app = Express();
var web = http.Server(app);
var comm = new communication.Communication(web);

app.use(bodyparser.urlencoded({extended: true}));

function setupServer() {
	app.get("/", function (req, res) {
		res.send(tpls.overview({
			info: info,
			rooms: entities.rooms
		}));
	});

	app.get("/rooms/add", function (req, res) {
		res.send(tpls.rooms.add({
			info: info
		}));
	});

	app.post("/rooms/add", function (req, res) {
		var name = req.body.name;

		if (typeof(name) == "string" && name.length > 0) {
			entities.createRoom(name, function (room) {
				res.redirect("/rooms/" + room.id);
			});
		} else {
			res.send(tpls.rooms.add({
				info: info,
				error: true
			}));
		}
	});

	app.get("/rooms/:id", function (req, res) {
		if (req.params.id in entities.rooms) {
			var room = entities.rooms[req.params.id];

			res.send(tpls.room({
				info: info,
				entities: room.entities
			}));
		} else {
			res.status(404).send("No room with that ID found");
		}
	});

	web.listen(3001);
}

backends.loadAll(function () {
	entities.loadAll(comm, setupServer);
});

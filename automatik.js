var http = require("http");
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

function setupServer() {
	app.get("/", function (req, res) {
		var rooms = [];

		for (var id in entities.rooms) {
			rooms.push(tpls.boxes.room(entities.rooms[id]));
		}

		res.send(tpls.overview({
			info: info,
			rooms: rooms
		}));
	});

	app.get("/rooms", (req, res) => res.redirect("/"));

	app.get("/rooms/:id", function (req, res) {
		if (req.params.id in entities.rooms) {
			var room = entities.rooms[req.params.id];

			res.send(tpls.room({
				info: info,
				room: room.id,
				entities: room.entities.map(entity => entity.renderBox())
			}));
		} else {
			res.status(404).send("No room with that ID found");
		}
	});

	web.listen(3001);
}

backends.loadAll(function (_, datapoints) {
	entities.loadAll(datapoints, comm, setupServer);
});

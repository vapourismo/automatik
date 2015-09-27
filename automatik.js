var tpls = require("./lib/templates");

var db = require("./src/database.js");
var instances = require("./src/instances.js");
var server = require("./src/server.js");

instances.loadInstances(db, server.comm);

const info = {
	title: "automatik",
	version: "0.0.0"
};

server.express.get("/", function (req, res) {
	var rooms = [];

	for (var id in instances.rooms) {
		rooms.push(tpls.boxes.room(instances.rooms[id]));
	}

	res.send(tpls.overview({
		info: info,
		rooms: rooms
	}));
});

server.express.get("/rooms", (req, res) => res.redirect("/"));

server.express.get("/rooms/:id", function (req, res) {
	if (req.params.id in instances.rooms) {
		var room = instances.rooms[req.params.id];

		res.send(tpls.room({
			info: info,
			room: room.id,
			entities: room.entities.map(entity => entity.renderBox())
		}));
	} else {
		res.status(404).send("No room with ID found");
	}
});

server.http.listen(3001);

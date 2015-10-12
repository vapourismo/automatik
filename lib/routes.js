var tpls = require("./templates");
var entities = require("./entities");
var express = require("./external").express;

express.get("/", function (req, res) {
	res.send(tpls.overview({
		rooms: entities.rooms
	}));
});

express.get("/rooms/add", function (req, res) {
	res.send(tpls.rooms.add());
});

express.post("/rooms/add", function (req, res) {
	var name = req.body.name;

	if (typeof(name) == "string" && name.length > 0) {
		entities.createRoom(name, function (room) {
			res.redirect("/rooms/" + room.id);
		});
	} else {
		res.send(tpls.rooms.add({
			error: true
		}));
	}
});

express.get("/rooms/:id", function (req, res) {
	if (req.params.id in entities.rooms) {
		var room = entities.rooms[req.params.id];

		res.send(tpls.room({
			entities: room.entities
		}));
	} else {
		res.status(404).send("No room with that ID found");
	}
});

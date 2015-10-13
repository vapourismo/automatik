const tpls = require("./templates");
const data = require("./data");

module.exports = function (express) {
	express.get("/", function (req, res) {
		res.send(tpls.overview({
			rooms: data.rooms
		}));
	});

	express.get("/rooms/:id", function (req, res) {
		if (req.params.id in data.rooms) {
			const room = data.rooms[req.params.id];

			res.send(tpls.room({
				entities: room.entities
			}));
		} else {
			res.status(404).send("No room with that ID found");
		}
	});
}

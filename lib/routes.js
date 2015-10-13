const tpls = require("./templates");
const data = require("./data");

module.exports = function (express) {
	express.get("/", function (req, res) {
		res.send(tpls.pages.index({
			rooms: data.rooms,
			editable: false
		}));
	});

	express.get("/rooms/:id", function (req, res) {
		if (req.params.id in data.rooms) {
			const room = data.rooms[req.params.id];

			res.send(tpls.pages.room({
				entities: room.entities
			}));
		} else {
			res.status(404).send("No room with that ID found");
		}
	});
}

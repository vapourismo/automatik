const SocketIO = require("socket.io");
const data     = require("./data");

function listRooms() {
	var rooms = [];

	for (var id in data.rooms) {
		rooms.push(data.rooms[id].info);
	}

	this.emit("ListRooms", rooms);
}

function addRoom(name) {
	if (typeof(name) != "string" || name.length < 1)
		return;

	data.createRoom(name, listRooms.bind(this));
}

module.exports = function (http) {
	const sock = SocketIO(http);
	sock.on("connection", function (client) {
		client.on("ListRooms", listRooms);
		client.on("AddRoom", addRoom);
	});
};

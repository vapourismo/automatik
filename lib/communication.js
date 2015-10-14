const SocketIO = require("socket.io");
const data     = require("./data");

function onListRooms() {
	var rooms = [];

	for (var id in data.rooms) {
		rooms.push(data.rooms[id].info);
	}

	this.emit("ListRooms", rooms);
}

module.exports = function (http) {
	const sock = SocketIO(http);
	sock.on("connection", function (client) {
		client.on("ListRooms", onListRooms);
	});
};

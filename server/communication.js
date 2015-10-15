const SocketIO = require("socket.io");
const data     = require("./data");

function BrowserClient(server, client) {
	this.server = server;
	this.client = client;

	this.client.on("ListRooms", this.listRooms.bind(this));
	this.client.on("AddRoom",   this.addRoom.bind(this));
}

BrowserClient.prototype = {
	listRooms: function () {
		var rooms = [];

		for (var id in data.rooms) {
			rooms.push(data.rooms[id].info);
		}

		this.server.emit("ListRooms", rooms);
	},

	displayError: function (err) {
		this.client.emit("DisplayError", err);
	},

	onCreateRoom: function (err) {
		if (err) this.displayError(err);
		else     this.listRooms();
	},

	addRoom: function (name) {
		if (typeof(name) != "string" || name.length < 1)
			return;

		data.createRoom(name, this.onCreateRoom.bind(this));
	}
};

module.exports = function (http) {
	var server = SocketIO(http);
	server.on("connection", client => new BrowserClient(server, client));
};

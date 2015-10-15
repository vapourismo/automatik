const SocketIO = require("socket.io");
const data     = require("./data");

function BrowserClient(client) {
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

		this.client.emit("ListRooms", rooms);
	},

	displayError: function (err) {
		this.client.emit("DisplayError", err);
	},

	addRoom: function (name) {
		if (typeof(name) != "string" || name.length < 1)
			return;

		data.createRoom(name, function (err) {
			if (err) this.displayError(err);
			else     this.listRooms();
		}.bind(this));
	}
};

module.exports = function (http) {
	SocketIO(http).on("connection", client => new BrowserClient(client));
};

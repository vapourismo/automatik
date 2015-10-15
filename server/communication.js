const SocketIO = require("socket.io");
const data     = require("./data");

function BrowserClient(server, client) {
	this.server = server;
	this.client = client;

	this.client.on("ListRooms", this.onListRooms.bind(this));
	this.client.on("AddRoom",   this.onAddRoom.bind(this));
}

BrowserClient.prototype = {
	onListRooms: function (broadcast) {
		var rooms = [];

		for (var id in data.rooms) {
			rooms.push(data.rooms[id].info);
		}

		this.client.emit("ListRooms", rooms);
	},

	onAddRoom: function (name) {
		if (typeof(name) != "string" || name.length < 1)
			return;

		data.createRoom(name, function (err) {
			if (err) {
				this.displayError(err);
			} else {
				this.onListRooms();
				this.updateRooms();
			}
		}.bind(this));
	},

	updateRooms: function () {
		this.server.emit("UpdateRooms");
	},

	displayError: function (err) {
		this.client.emit("DisplayError", err);
	}
};

module.exports = function (http) {
	var server = SocketIO(http);
	server.on("connection", client => new BrowserClient(server, client));
};

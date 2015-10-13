const SocketIO = require("socket.io");
const http     = require("./external").http;
const data     = require("./data");

function ClientCommunication(client) {
	this.client = client;

	client.on("ClickEntity", this.onClickEntity.bind(this));
	client.on("InformEntity", this.onInformEntity.bind(this));
}

ClientCommunication.prototype.onClickEntity = function (id) {
	if (id in data.entities)
		data.entities[id].click(this);
};

ClientCommunication.prototype.onInformEntity = function (msg) {
	if (msg.id in data.entities)
		data.entities[msg.id].inform(this, msg.message);
};

ClientCommunication.prototype.showPopup = function (title, contents, script) {
	this.client.emit("ShowPopup", {title: title, contents: contents, script: script});
};

function Communication() {
	this.socket = SocketIO(http);
	this.socket.on("connection", this.onConnection.bind(this));
}

Communication.prototype.onConnection = function (client) {
	new ClientCommunication(client);
};

Communication.prototype.updateEntity = function (entity) {
	this.socket.emit("UpdateEntity", {
		id: entity.info.id,
		value: entity.render()
	});
};

module.exports = new Communication();

var SocketIO = require("socket.io");
var http = require("./external").http;
var entities = require("./entities");

function ClientCommunication(client) {
	this.client = client;

	client.on("ClickEntity", this.onClickEntity.bind(this));
	client.on("InformEntity", this.onInformEntity.bind(this));
}

ClientCommunication.prototype.onClickEntity = function (id) {
	if (id in entities.entities)
		entities.entities[id].click(this);
};

ClientCommunication.prototype.onInformEntity = function (msg) {
	if (msg.id in entities.entities)
		entities.entities[msg.id].inform(this, msg.message);
};

ClientCommunication.prototype.showPopup = function (title, contents, script) {
	this.client.emit("ShowPopup", {title: title, contents: contents, script: script});
};

function Communication(web) {
	this.socket = SocketIO(http);
	this.socket.on("connection", this.onConnection.bind(this));
}

Communication.prototype.onConnection = function (client) {
	new ClientCommunication(client);
};

Communication.prototype.updateEntity = function (entity) {
	this.socket.emit("UpdateEntity", {
		id: entity.id,
		name: entity.name,
		value: entity.render()
	});
};

module.exports = new Communication(http);

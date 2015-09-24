function ClientCommunication(client, instances) {
	this.client = client;
	this.instances = instances;

	client.on("ClickEntity", this.onClickEntity.bind(this));
}

ClientCommunication.prototype.onClickEntity = function (id) {
	if (id in this.instances.entities)
		this.instances.entities[id].click(this);
};

ClientCommunication.prototype.showPopup = function (title, contents) {
	this.client.emit("ShowPopup", {title: title, contents: contents});
};

function Communication(socket, instances) {
	this.socket = socket;
	this.instances = instances;

	socket.on("connection", this.onConnection.bind(this));
}

Communication.prototype.onConnection = function (client) {
	new ClientCommunication(client, this.instances);
};

Communication.prototype.updateEntity = function (entity) {
	this.socket.emit("UpdateEntity", {
		id: entity.id,
		name: entity.name,
		value: entity.render()
	});
};

module.exports = {
	Communication: Communication
};

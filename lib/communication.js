const SocketIO = require("socket.io");
// const data     = require("./data");

// function BrowserClient(client) {
// 	this.client = client;
// }

// BrowserClient.prototype.onClickEntity = function (id) {
// 	if (id in data.entities)
// 		data.entities[id].click(this);
// };

// BrowserClient.prototype.onInformEntity = function (msg) {
// 	if (msg.id in data.entities)
// 		data.entities[msg.id].inform(this, msg.message);
// };

// BrowserClient.prototype.showPopup = function (title, contents, script) {
// 	this.client.emit("ShowPopup", {title: title, contents: contents, script: script});
// };

module.exports = function (http) {
	const sock = SocketIO(http);
	// sock.on("connection", client => new BrowserClient(client));
};

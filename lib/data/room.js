var tpls = require("../templates");

function Room(info) {
	this.info = info;
	this.entities = [];
}

Room.prototype = {
	renderBox: function () { return tpls.boxes.room(this) }
};

module.exports = Room;

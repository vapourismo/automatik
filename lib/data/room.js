var tpls = require("../templates");

function Room(db, info) {
	this.db = db;
	this.info = info;
	this.entities = [];
}

Room.prototype = {
	renderBox: function () { return tpls.boxes.room(this); }
};

module.exports = Room;

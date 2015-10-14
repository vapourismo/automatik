var tpls = require("../templates");

function Entity(db, info, instance) {
	this.db = db;
	this.info = info;
	this.instance = instance;

	// this.instance.listen(comm.updateEntity.bind(comm, this));
}

Entity.prototype = {
	render: function () {
		return this.instance.render();
	},

	renderBox: function () {
		return tpls.boxes.double(this);
	},

	click: function (client) {
		this.instance.click(client, this);
	},

	inform: function (client, msg) {
		this.instance.inform(client, msg);
	}
};

module.exports = Entity;

var tpls = require("./templates");
var classes = require("./classes");

function Entity(entity, slots, comm) {
	this.id = entity.id;
	this.name = entity.name;
	this.instance = new classes[entity.type](entity.conf, slots);

	this.instance.listen(comm.updateEntity.bind(comm, this));
}

Entity.prototype = {
	render: function () {
		return this.instance.render();
	},

	renderBox: function () {
		return tpls.boxes.entity({
			id: this.id,
			name: this.name,
			value: this.instance.render()
		});
	},

	click: function (client) {
		this.instance.click(client, this);
	}
};

module.exports = Entity;

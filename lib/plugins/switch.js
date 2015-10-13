var tpls = require("../templates");
var EventEmitter = require("events");

function Switch(info, slots) {
	this.info = info;
	this.control = slots.control;
	this.status = slots.status ? slots.status : slots.control;
	this.emitter = new EventEmitter();

	this.status.listen(function () {
		this.emitter.emit("value", this);
	}.bind(this));
}

Switch.prototype = {
	render: function () {
		return this.status.read() ? "On" : "Off";
	},

	renderBox: function () {
		return tpls.boxes.double({
			label: this.info.name,
			value: this.render()
		});
	},

	listen: function (callback) {
		this.emitter.on("value", callback);
	},

	mute: function (callback) {
		this.emitter.removeListener("value", callback);
	}
};

Switch.meta = {
	name: "Switch",
	description: "On and off",
	slots: {
		control: {
			name: "Control datapoint",
			optional: false
		},
		status: {
			name: "Status datapoint",
			optional: true
		}
	}
};

module.exports = {
	types: {
		switch: Switch
	}
};

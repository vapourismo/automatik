var tpls = require("../templates");
var EventEmitter = require("events");

function Temperature(info, slots) {
	this.info = info;

	const conf = info.conf || {};
	this.defaultValue = conf.defaultValue || 20;
	this.metric = conf.metric || "°C";

	this.control = slots.control;
	this.emitter = new EventEmitter();

	this.control.listen(function () {
		this.emitter.emit("value", this);
	}.bind(this));
}

Temperature.prototype = {
	value: function () {
		if (!this.control.empty()) {
			return Math.round(this.control.read() * 100) / 100;
		} else {
			return this.defaultValue;
		}
	},

	render: function () {
		return this.value() + this.metric;
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
	},
};

Temperature.meta = {
	name: "Temperature",
	description: "Display temperature",
	slots: {
		control: {
			name: "Temperature datapoint",
			optional: false
		}
	}
};

module.exports = {
	types: {
		temperature: Temperature
	}
};

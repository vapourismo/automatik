var tpls = require("../templates");
var EventEmitter = require("events");

function Temperature(conf, slots) {
	conf = conf || {};
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

	listen: function (callback) {
		this.emitter.on("value", callback);
	},

	mute: function (callback) {
		this.emitter.removeListener("value", callback);
	},

	click: function (client, entity) {
		client.showPopup(
			entity.name,
			tpls.popups.temperature({
				id: entity.info.id,
				value: this.value(),
				metric: this.metric
			}),
			"/static/classes/temperature.js"
		);
	},

	inform: function (client, value) {
		if (typeof(value) == "number")
			this.control.write(value);
	}
};

Temperature.meta = {
	name: "Temperature",
	description: "Display temperature",
	slots: [
		{
			id: "control",
			name: "Temperature datapoint",
			optional: false
		}
	]
};

module.exports = {
	types: {
		temperature: Temperature
	}
};

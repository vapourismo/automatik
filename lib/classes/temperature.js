var tpls = require("../templates");
var EventEmitter = require("events");

function Temperature(conf, slots) {
	conf = conf || {};

	this.metric = conf.metric || "°C";
	this.control = slots.control;
	this.emitter = new EventEmitter();

	this.control.listen(function () {
		this.emitter.emit("value", this);
	}.bind(this));
}

Temperature.prototype = {
	render: function () {
		if (!this.control.empty())
			return this.control.read() + this.metric;
		else
			return "Unknown";
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
				entity: entity
			}),
			"/static/classes/temperature.js"
		);
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
	"temperature": Temperature
};

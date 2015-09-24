var tpls = require("../templates");
var EventEmitter = require("events");

function Switch(conf, slots) {
	this.control = slots.control;
	this.emitter = new EventEmitter();

	this.control.listen(function () {
		this.emitter.emit("value", this);
	}.bind(this));
}

Switch.prototype = {
	render: function () {
		return this.control.read() ? "On" : "Off";
	},

	listen: function (callback) {
		this.emitter.on("value", callback);
	},

	mute: function (callback) {
		this.emitter.removeListener("value", callback);
	},

	click: function (client) {
		this.control.write(!this.control.read());
	}
};

Switch.meta = {
	name: "Switch",
	description: "On and off",
	slots: [
		{
			id: "control",
			name: "Control datapoint",
			optional: false
		}
	]
};

module.exports = {
	"switch": Switch
};

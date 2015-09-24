var tpls = require("../templates");
var EventEmitter = require("events");

function Switch(conf, slots) {
	this.control = slots.control;
	this.status = slots.status ? slots.status : slots.control;
	this.emitter = new EventEmitter();

	this.control.listen(function () {
		this.emitter.emit("value", this);
	}.bind(this));
}

Switch.prototype = {
	render: function () {
		return this.status.read() ? "On" : "Off";
	},

	listen: function (callback) {
		this.emitter.on("value", callback);
	},

	mute: function (callback) {
		this.emitter.removeListener("value", callback);
	},

	click: function (client) {
		this.control.write(!this.status.read());
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
		},
		{
			id: "status",
			name: "Control status datapoint",
			optional: true
		}
	]
};

module.exports = {
	"switch": Switch
};

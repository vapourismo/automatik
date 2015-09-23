var tpls = require("../templates");

function Switch(conf, slots) {
	this.control = slots.control;
}

Switch.prototype = {
	render: function () {
		return this.control.read() ? "On" : "Off";
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

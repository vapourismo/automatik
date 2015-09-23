var tpls = require("../templates");

function Switch(conf, slots) {
	this.control = slots.control;
}

Switch.prototype = {
	render: function () {
		var value = this.control.read();

		if (typeof(value) == "boolean") {
			return tpls.types.switch(value);
		} else {
			return tpls.types.invalidValue(value);
		}
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

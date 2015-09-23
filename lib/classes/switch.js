var tpls = require("../templates");

function Switch() {

}

Switch.prototype = {
	render: function (value) {
		if (typeof(value) == "boolean") {
			return tpls.types.switch(value);
		} else {
			return tpls.types.invalidValue(value);
		}
	}
};

Switch.meta = {
	name: "Switch",
	description: "On and off"
};

module.exports = {
	"switch": Switch
};

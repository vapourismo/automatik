var tpls = require("../templates");

function Celsius() {

}

Celsius.prototype = {
	render: function (value) {
		if (typeof(value) == "number") {
			return tpls.types.celsius(Math.round(value * 100) / 100);
		} else {
			return tpls.types.invalidValue(value);
		}
	}
};

Celsius.meta = {
	name: "Celsius",
	description: "Temperature in degree celsius"
};

module.exports = {
	"temp_celsius": Celsius
};

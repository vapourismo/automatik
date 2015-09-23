var tpl = require("automatik/templates");

module.exports = {
	renderValue: function (value) {
		if (typeof(value) == "number") {
			return tpl.types.celsius(Math.round(value * 100) / 100);
		} else {
			return tpl.types.invalidValue(value);
		}
	}
};

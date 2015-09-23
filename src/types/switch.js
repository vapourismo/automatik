var tpl = require("automatik/templates");

module.exports = {
	renderValue: function (value) {
		if (typeof(value) == "boolean") {
			return tpl.types.switch(value);
		} else {
			return tpl.types.invalidValue(value);
		}
	}
};

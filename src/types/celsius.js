module.exports = {
	renderValue: function (value) {
		if (typeof(value) == "number") {
			return (Math.round(value * 100) / 100) + "°C";
		} else {
			return "Invalid value";
		}
	}
};

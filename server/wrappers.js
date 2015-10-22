const defaultDriverSpec = {
	configure: function (config) {}
};

function createDriver(spec) {
	if (!(spec instanceof Object))
		throw new Error("Driver specification needs to be an object");

	spec.__proto__ = defaultDriverSpec;
	return spec;
}

module.exports = {
	createDriver: createDriver
}

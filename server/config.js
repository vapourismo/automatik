const fs = require("fs");

const defaultConfig = {
	database: {
		host: "localhost",
		user: "automatik",
		database: "automatik"
	},
	colorLogging: true,
	logAsyncErrors: true
};

function validateObject(schema, instance) {
	if (typeof(schema) != typeof(instance))
		return schema;

	if (schema instanceof Array) {
		return instance;
	} else if (schema instanceof Object) {
		const object = {};

		for (var key in schema) {
			object[key] = validateObject(schema[key], instance[key]);
		}

		return object;
	} else {
		return instance;
	}
}

try {
	module.exports = validateObject(defaultConfig, JSON.parse(fs.readFileSync("config.json")));
} catch (e) {
	module.exports = defaultConfig;
}

var fs = require("fs");

try {
	module.exports = JSON.parse(fs.readFileSync("config.json"));
} catch (e) {
	module.exports = {
		database: {
			host: "localhost",
			user: "automatik",
			database: "automatik"
		}
	};
}

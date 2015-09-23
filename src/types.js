var fs = require("fs");

const typesPathRegex = /(.*)\.js$/;

var types = {};

fs.readdir("./src/types", function (err, files) {
	if (err) {
		console.error("Failed to list types", err);
		process.exit(1);
		return;
	}

	files.forEach(function (path) {
		if (typesPathRegex.test(path) && fs.statSync("./src/types/" + path).isFile()) {
			var name = typesPathRegex.exec(path)[1];

			console.log("Loading type '" + name + "'")
			types[name] = require("./types/" + path);
		}
	});
});

module.exports = types;

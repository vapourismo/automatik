var fs = require("fs");

var types = {};

fs.readdir("./src/types", function (err, files) {
	if (err) {
		console.error("Failed to list types", err);
		process.exit(1);
		return;
	}

	files.forEach(function (path) {
		if (backendPathRegex.test(path) && fs.statSync("./src/types/" + path).isFile()) {
			var name = backendPathRegex.exec(path)[1];

			console.log("Loading type '" + name + "'")
			types[name] = require("./types/" + path);
		}
	});
});

module.exports = types;

const path       = require("path");
const datapoints = require("./datapoints");
const backends   = require("./backends");
const groups     = require("./groups");
const util       = require("./utilities");

// Traverse 'plugins/' directory and load each file
const pluginDirectory = path.join(path.dirname(module.filename), "plugins");
util.iterateFiles(pluginDirectory, function (file) {
	// Do not load junk
	if (path.extname(file) != ".js")
		return;

	util.inform("plugins", "Loading '" + path.relative(pluginDirectory, file) + "'");
	require(file);
});

// WebSocket server
const server = require("socket.io")();
require("./communication")(server);

// Load from database
(function* () {
	try {
		yield backends.load();
		yield datapoints.load();
		yield groups.load();

		server.listen(3001);
	} catch (error) {
		util.abort("data", error instanceof Error ? error.stack : error);
	}
}).async();

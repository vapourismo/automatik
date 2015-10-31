const path       = require("path");
const datapoints = require("./datapoints");
const backends   = require("./backends");
const components = require("./components");
const groups     = require("./groups");
const util       = require("./utilities");
const Namespace  = require("./namespace");

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
const ns = new Namespace();

// Load from database
(function* () {
	try {
		yield groups.load(ns);

		yield backends.load();
		yield datapoints.load();
		yield components.load(ns);

		ns.listen(3001);
	} catch (error) {
		util.abort("data", error instanceof Error ? error.stack : error);
	}
}).async();

const util     = require("./utilities");
const groups   = require("./data/groups");
const backends = require("./data/backends");

(function* () {
	try {
		yield backends.load();
		yield groups.load();
	} catch (error) {
		util.abort("data", error instanceof Error ? error.stack : error);
	}
}).async()();

module.exports = {
	backends: backends,
	groups:   groups
};

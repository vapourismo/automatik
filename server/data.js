const util     = require("./utilities");
const groups   = require("./data/groups");
const backends = require("./data/backends");

(function* () {
	backends.load();
	groups.load();
}).async()();

module.exports = {
	backends: backends,
	groups:   groups
};

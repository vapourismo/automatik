var external = require("./lib/external");
var tpls = require("./lib/templates");
var backends = require("./lib/backends");
var entities = require("./lib/entities");
var communication = require("./lib/communication");

require("./lib/routes");

backends.loadAll(function () {
	entities.loadAll(communication, function () {
		external.http.listen(3001);
	});
});

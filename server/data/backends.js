const path    = require("path");

const db      = require("../database");
const util    = require("../utilities");
const plugins = require("../plugins");

const backends = {};

function configureBackend(row) {
	if (row.driver in drivers) {
		backends[row.id] = new drivers[row.driver](row.config);
		util.inform("backend: " + row.id, "Instantiated '" + row.name + "'");
	} else {
		util.abort("backend: " + row.id, "Driver '" + row.driver + "' does not exist");
	}
}

module.exports = {
	load: function* () {
		try {
			const result = yield db.queryAsync("SELECT * FROM backends");

			result.rows.forEach(function (row) {
				const tag = "backend: " + row.id;
				const backend = plugins.instantiateDriver(row.driver, row.config);

				if (backend) {
					backends[row.id] = backend;
					util.inform(tag, "Instantiated '" + row.name + "'");
				} else {
					util.error(tag, "Could not find driver '" + row.driver + "'");
				}
			});
		} catch (err) {
			util.abort("backends", "Failed to fetch instances", err);
		}
	}.async()
};

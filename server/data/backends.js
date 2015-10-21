const path     = require("path");
const db       = require("../database");
const util     = require("../utilities");
const plugins  = require("../plugins");

const backends = {};

module.exports = {
	load: function* () {
		try {
			// Load backends
			const backendsResult = yield db.queryAsync("SELECT * FROM backends");
			backendsResult.rows.forEach(function (row) {
				const tag = "backend: " + row.id;
				const driver = plugins.drivers[row.driver];

				if (!driver)
					return util.error(tag, "Could not find driver '" + row.driver + "'");

				// TODO: Figure out what to do with drivers

				util.inform(tag, "Instantiated '" + row.name + "'");
			});
		} catch (err) {
			util.abort("datapoints", "Failed to fetch instances", err);
		}
	}.async(),

	all: backends
};

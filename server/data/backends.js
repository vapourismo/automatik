const path    = require("path");
const db      = require("../database");
const util    = require("../utilities");
const drivers = require("../drivers");

const backends = {};

const BackendPrototype = {

};

function makeBackend(row) {
	util.inform("backend: " + row.id, "Loading '" + row.name + "'");

	row.__proto__ = BackendPrototype;
	row.driver = drivers.create(row.driver, row.config);

	return backends[row.id] = row;
}

module.exports = {
	load: function* () {
		const backendsResult = yield db.queryAsync("SELECT * FROM backends");
		backendsResult.rows.forEach(makeBackend);
	}.async(),

	all: backends
};

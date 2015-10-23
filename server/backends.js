"use strict";

const path   = require("path");
const db     = require("./database");
const util   = require("./utilities");
const Driver = require("./driver");

const backends = {};

class Backend {
	constructor(row) {
		Object.assign(this, row);
		row.driver = Driver.create(this.driver, this.config);
	}
}

module.exports = {
	load: function* () {
		const backendsResult = yield db.queryAsync("SELECT * FROM backends");
		backendsResult.rows.forEach(function (row) {
			util.inform("backends", "Registering '" + row.name + "'");
			backends[row.id] = new Backend(row);
		});
	}.async,

	find: function (id) {
		const backend = backends[id];
		return backend instanceof Backend ? backend : null;
	}
};

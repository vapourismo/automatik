const pg     = require("pg");
const config = require("./config");

// Connect
const db = new pg.Client(config.database || {});
db.connect();

// Async query method
db.queryAsync = function (...args) {
	return new Promise(function (accept, reject) {
		this.query(...args, function (err, result) {
			if (err) reject(err);
			else     accept(result);
		});
	}.bind(this));
};

module.exports = db;

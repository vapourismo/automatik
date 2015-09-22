var pg = require("pg");

module.exports = new pg.Client({
	host: "localhost",
	user: "ole",
	database: "ole"
});

module.exports.connect();

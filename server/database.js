const pg     = require("pg");
const config = require("./config");

const db = new pg.Client(config.database || {});
db.connect();

module.exports = db;

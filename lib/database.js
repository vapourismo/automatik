var pg = require("pg");
var config = require("./config");

var db = new pg.Client(config.database || {});
db.connect();

module.exports = db;


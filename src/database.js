var pg = require("pg");
var config = require("../lib/config");

module.exports = new pg.Client(config.database || {});
module.exports.connect();

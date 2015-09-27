var pg = require("pg");
var config = require("./config");

module.exports = new pg.Client(config.database || {});
module.exports.connect();

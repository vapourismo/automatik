var Express = require("express");

var pg = require("pg");
var http = require("http");
var bodyparser = require("body-parser");

var config = require("./config");

// Database
var database = new pg.Client(config.database || {});
database.connect();

// Express instance
var express = Express();
express.use(bodyparser.urlencoded({extended: true}));

// HTTP server
var http = http.Server(express);

// Exports
module.exports = {
	database: database,
	express:  express,
	http:     http
};

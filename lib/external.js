const Express    = require("express");
const Server     = require("http").Server;

const pg         = require("pg");
const bodyparser = require("body-parser");

// Express instance
const express = Express();
express.use(bodyparser.urlencoded({extended: true}));

// HTTP server
const http = Server(express);

// Exports
module.exports = {
	express:  express,
	http:     http
};

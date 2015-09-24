var Express = require("express");
var SocketIO = require("socket.io");
var Server = require("http").Server;
var Communication = require("../lib/communication").Communication;
var instances = require("./instances");

var express = Express();
var http = Server(express);
var comm = new Communication(SocketIO(http), instances);

module.exports = {
	express: express,
	http: http,
	comm: comm
};

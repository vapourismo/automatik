var express = require("express")();
var http = require("http").Server(express);
var sockio = require("socket.io")(http);

module.exports = {
	express: express,
	http: http,
	sockio: sockio
};

// Express instance
const express = require("express")();

express.get("/", function (req, res) { res.send("Hello World"); });

// HTTP server
const http = require("http").Server(express);

// Application
require("./lib/communication")(http);

http.listen(3001);

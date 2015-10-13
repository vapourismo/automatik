// Express instance
const express = require("express")();
express.use(require("body-parser").urlencoded({extended: true}));

// HTTP server
const http = require("http").Server(express);

// Application
require("./lib/routes")(express);
require("./lib/communication")(http);

http.listen(3001);

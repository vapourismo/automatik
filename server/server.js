// Express instance
const express = require("express")();

// HTTP server
const http = require("http").Server(express);

// Application
require("./communication")(http);

http.listen(3001);

var express = require("express");
var dot = require("dot");

var tpl = dot.process({path: "src/views"});
var web = express();

const info = {
	title: "automatik",
	version: "0.0.0"
};

web.get("/", function (req, res) {
	res.send(tpl.index({
		info: info
	}));
});

web.listen(3001);

var express = require("express");
var dot = require("dot");

var tpl = dot.process({path: "src/views"});
tpl.boxes = dot.process({path: "src/views/boxes"});

var web = express();

const info = {
	title: "automatik",
	version: "0.0.0"
};

web.get("/", function (req, res) {
	res.send(tpl.index({
		info: info,
		tiles: [
			tpl.boxes.link({
				label: "Living room",
				href: "/room/living_room"
			})
		]
	}));
});

web.listen(3001);

var web = require("express")();
var tpl = require("./templates.js");

const info = {
	title: "automatik",
	version: "0.0.0"
};

web.get("/", function (req, res) {
	var testTile = "<div class='test'></div>";

	res.send(tpl.overview({
		info: info,
		major: [testTile, testTile],
		minor: [testTile, testTile, testTile,
		        testTile, testTile, testTile,
		        testTile, testTile, testTile,
		        testTile, testTile, testTile]
	}));
});

web.listen(3001);

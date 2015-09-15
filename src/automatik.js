var web = require("express")();
var tpl = require("./templates.js");

const info = {
	title: "automatik",
	version: "0.0.0"
};

web.get("/", function (req, res) {
	var testTile = "<div class='box'></div>";

	var navTile = tpl.boxes.nav({
		contents: "Wohnzimmer"
	});

	res.send(tpl.overview({
		info: info,
		major: [testTile, testTile],
		minor: [navTile, testTile, testTile,
		        testTile, testTile, testTile,
		        testTile, testTile, testTile,
		        testTile, testTile, testTile]
	}));
});

web.listen(3001);

console.log(web);

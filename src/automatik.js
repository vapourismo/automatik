var koa = require("koa");
var route = require("koa-route");
var dot = require("dot");

var tpl = dot.process({path: "src/views"});
tpl.boxes = dot.process({path: "src/views/boxes"});
var web = koa();

const info = {
	title: "automatik",
	version: "0.0.0"
};

web.use(route.get("/", function*() {
	this.response.body = tpl.index({
		info: info,
		tiles: [
			tpl.boxes.default({
				id: "temp_living_room",
				label: "Living room",
				value: "20°C",
				href: "/path/to/tile/contents"
			})
		]
	});
}));

web.listen(3001);

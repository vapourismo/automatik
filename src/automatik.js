var koa = require("koa");
var route = require("koa-route");
var dot = require("dot");

var tpl = dot.process({path: "src/views"});
var web = koa();

var info = {
	title: "automatik",
	version: "0.0.0"
};

web.use(route.get("/", function*() {
	this.response.body = tpl.index({
		info: info
	});
}));

web.listen(3001);

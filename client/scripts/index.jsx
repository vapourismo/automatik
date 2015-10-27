const React          = require("react");
const ReactDOM       = require("react-dom");
const page           = require("page");
const GroupContainer = require("./groups.jsx");
const Notifier       = require("./notifier.jsx");
const base           = require("./base.jsx");

base.serverSocket.on("DisplayError", Notifier.displayError);

base.serverSocket.on("error", function (err) {
	console.error(err);
});

base.serverSocket.on("disconnect", function () {
	Notifier.displayError("Lost connection to server");
});

base.serverSocket.on("reconnect", function () {
	Notifier.displayInfo("Successfully reconnected");
});

function displayGroup(group) {
	ReactDOM.render(
		<div>
			<GroupContainer key={group} group={group}/>
			<Notifier />
		</div>,
		document.getElementById("canvas")
	);
}

page(/^\/groups\/(\d+)/, function (ctx) {
	displayGroup(Number.parseInt(ctx.params[0]));
});

page("/", function () {
	displayGroup(null);
});

page(function () {
	page.redirect("/");
});

window.addEventListener("load", function () {
	page({click: false});
});

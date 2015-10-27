import page           from "page";
import React          from "react";
import ReactDOM       from "react-dom";

import Notifier       from "./notifier.jsx";
import GroupContainer from "./groups.jsx";

function displayGroup(group) {
	ReactDOM.render(
		<div>
			<GroupContainer key={group} group={group}/>
			<Notifier />
		</div>,
		document.getElementById("canvas")
	);
}

// Routes
page(/^\/groups\/(\d+)/, ctx => displayGroup(Number.parseInt(ctx.params[0])));
page("/",                ctx => displayGroup(null));

// Default handler
page(ctx => page.redirect("/"));

window.addEventListener("load", function () {
	page({click: false});
});

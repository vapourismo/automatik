"use strict";

var serverSocket = io();

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27) window.dispatchEvent(new Event("Escape"));
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body) window.dispatchEvent(new Event("Escape"));
});

var Tile = React.createClass({
	displayName: "Tile",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "tile" },
			this.props.children
		);
	}
});

var Container = React.createClass({
	displayName: "Container",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "container" },
			this.props.children
		);
	}
});
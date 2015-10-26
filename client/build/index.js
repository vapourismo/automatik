"use strict";

var GroupContainer = require("./groups");
var BackendContainer = require("./backends");
var base = require("./base");

var Notification = React.createClass({
	displayName: "Notification",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "notification fade-out" },
			this.props.children
		);
	}
});

var Notifier = React.createClass({
	displayName: "Notifier",

	getInitialState: function getInitialState() {
		return {
			notifications: []
		};
	},

	onDecay: function onDecay() {
		this.setState({
			notifications: this.state.notifications.slice(1)
		});
	},

	onMessage: function onMessage(ev) {
		this.setState({
			notifications: this.state.notifications.concat([React.createElement(
				Notification,
				{ key: this.counter++ },
				ev.message
			)])
		});

		setTimeout(this.onDecay, 15000);
	},

	componentDidMount: function componentDidMount() {
		if (!this.counter) this.counter = 0;

		window.addEventListener("DisplayError", this.onMessage);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("DisplayError", this.onMessage);
	},

	render: function render() {
		return React.createElement(
			"div",
			{ className: "notifier" },
			this.state.notifications
		);
	}
});

function displayError(message) {
	window.dispatchEventEasily("DisplayError", {
		message: message
	});
}

base.serverSocket.on("DisplayError", displayError);

base.serverSocket.on("error", function (err) {
	console.error(err);
});

base.serverSocket.on("disconnect", function () {
	displayError("Lost connection to server");
});

base.serverSocket.on("reconnect", function () {
	displayError("Successfully reconnected");
});

function displayGroup(group) {
	ReactDOM.render(React.createElement(
		"div",
		null,
		React.createElement(GroupContainer, { key: "group-container-" + group, group: group }),
		React.createElement(Notifier, null)
	), document.getElementById("canvas"));
}

function displayBackends() {
	ReactDOM.render(React.createElement(
		"div",
		null,
		React.createElement(BackendContainer, { key: "backend-container" }),
		React.createElement(Notifier, null)
	), document.getElementById("canvas"));
}

page(/^\/groups\/(\d+)/, function (ctx) {
	return displayGroup(Number.parseInt(ctx.params[0]));
});

page("/backends", displayBackends);

page("/", function () {
	displayGroup(null);
});

page(function () {
	page.redirect("/");
});

window.addEventListener("load", function () {
	page({
		click: false
	});
});
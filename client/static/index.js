"use strict";

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

var loadedScripts = {};
serverSocket.on("AttachScript", function (url) {
	if (url in loadedScripts) return;

	var scriptElement = document.createElement("script");
	scriptElement.src = url;

	loadedScripts[url] = scriptElement;
	document.head.appendChild(scriptElement);
});

var loadedStyles = {};
serverSocket.on("AttachStyle", function (url) {
	if (url in loadedStyles) return;

	var linkElement = document.createElement("link");
	linkElement.href = url;
	linkElement.type = "text/css";
	linkElement.rel = "stylesheet";

	loadedStyles[url] = linkElement;
	document.head.appendChild(linkElement);
});

serverSocket.on("DisplayError", displayError);

serverSocket.on("error", function (err) {
	console.error(err);
});

serverSocket.on("disconnect", function () {
	displayError("Lost connection to server");
});

serverSocket.on("reconnect", function () {
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
	page({
		click: false
	});
});
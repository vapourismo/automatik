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

serverSocket.on("DisplayError", displayError);

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
	console.log("none");
	page.redirect("/");
});

window.addEventListener("load", function () {
	page({
		click: false
	});
});
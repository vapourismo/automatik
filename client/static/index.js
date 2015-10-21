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

	onMessage: function onMessage(message) {
		this.setState({
			notifications: this.state.notifications.concat([React.createElement(
				Notification,
				{ key: this.counter++ },
				message
			)])
		});

		setTimeout(this.onDecay, 15000);
	},

	onLocalMessage: function onLocalMessage(ev) {
		this.onMessage(ev.message);
	},

	componentDidMount: function componentDidMount() {
		if (!this.counter) this.counter = 0;

		serverSocket.on("DisplayError", this.onMessage);
		window.addEventListener("DisplayError", this.onLocalMessage);
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("DisplayError", this.onMessage);
		window.removeEventListener("DisplayError", this.onLocalMessage);
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

window.addEventListener("load", function () {
	ReactDOM.render(React.createElement(
		"div",
		null,
		React.createElement(GroupContainer, { group: null }),
		React.createElement(Notifier, null)
	), document.getElementById("canvas"));
});
"use strict";

var serverSocket = io();

window.dispatchEventEasily = function (tag, attach) {
	var event = new Event(tag);

	if (attach instanceof Object) {
		for (var key in attach) event[key] = attach[key];
	}

	window.dispatchEvent(event);
};

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27) window.dispatchEventEasily("Escape");
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body) window.dispatchEventEasily("Escape");
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

var InputBox = React.createClass({
	displayName: "InputBox",

	onRequestEditing: function onRequestEditing() {
		this.setState({ editing: true });
	},

	onSubmit: function onSubmit(ev) {
		this.props.onSubmit(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	onCancel: function onCancel(ev) {
		if (this.props.onCancel) this.props.onCancel(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenContext", this.onCancel);
		window.addEventListener("Escape", this.onCancel);

		this.refs.input.select();
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenContext", this.onCancel);
		window.removeEventListener("Escape", this.onCancel);
	},

	render: function render() {
		return React.createElement(
			"form",
			{ className: "box input", onSubmit: this.onSubmit },
			React.createElement("input", { ref: "input", type: "text", defaultValue: this.props.defaultValue, onBlur: this.onCancel })
		);
	},

	componentDidUpdate: function componentDidUpdate() {
		this.refs.input.select();
	}
});

var ContextBox = React.createClass({
	displayName: "ContextBox",

	render: function render() {
		var items = [];

		for (var name in this.props.items) items.push(React.createElement(
			"li",
			{ key: items.length, onClick: this.props.items[name] },
			name
		));

		return React.createElement(
			"div",
			{ className: "box context" },
			items
		);
	}
});

var ConfirmBox = React.createClass({
	displayName: "ConfirmBox",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "box delete", onClick: this.props.onConfirm },
			React.createElement(
				"span",
				null,
				"Are you sure?"
			)
		);
	}
});

var WaitingBox = React.createClass({
	displayName: "WaitingBox",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "box waiting" },
			React.createElement("i", { className: "fa fa-refresh rotate" })
		);
	}
});

module.exports = {
	Tile: Tile,
	Container: Container,
	InputBox: InputBox,
	ContextBox: ContextBox,
	ConfirmBox: ConfirmBox,
	WaitingBox: WaitingBox,

	serverSocket: serverSocket
};
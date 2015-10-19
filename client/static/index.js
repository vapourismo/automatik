"use strict";

var GroupContainer = React.createClass({
	displayName: "GroupContainer",

	getInitialState: function getInitialState() {
		return { groups: [], showTempTile: false };
	},

	requestSubGroups: function requestSubGroups() {
		serverSocket.emit("ListSubGroups", this.props.group);
	},

	onListSubGroups: function onListSubGroups(info) {
		if (info.group != this.props.group) return;

		this.setState({
			groups: info.subGroups.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			})
		});
	},

	onUpdateGroup: function onUpdateGroup(group) {
		if (group == this.props.group) this.requestSubGroups();
	},

	componentDidMount: function componentDidMount() {
		serverSocket.on("ListSubGroups", this.onListSubGroups);
		serverSocket.on("UpdateGroup", this.onUpdateGroup);

		this.counter = 0;
		this.requestSubGroups();
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("ListSubGroups", this.onListSubGroups);
		serverSocket.removeListener("UpdateGroup", this.onUpdateGroup);
	},

	render: function render() {
		var tiles = this.state.groups.map((function (group) {
			return React.createElement(GroupTile, { key: this.counter++, info: group });
		}).bind(this));

		tiles.push(React.createElement(AddGroupTile, { key: "add-group", group: this.props.group }));

		return React.createElement(
			Container,
			null,
			tiles
		);
	}
});

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

	componentDidMount: function componentDidMount() {
		var counter = 0;

		serverSocket.on("DisplayError", (function (err) {
			this.setState({
				notifications: this.state.notifications.concat([React.createElement(
					Notification,
					{ key: counter++ },
					err
				)])
			});

			setTimeout(this.onDecay, 15000);
		}).bind(this));
	},

	render: function render() {
		return React.createElement(
			"div",
			{ className: "notifier" },
			this.state.notifications
		);
	}
});

window.addEventListener("load", function () {
	ReactDOM.render(React.createElement(
		"div",
		null,
		React.createElement(GroupContainer, { group: null }),
		React.createElement(Notifier, null)
	), document.getElementById("canvas"));
});
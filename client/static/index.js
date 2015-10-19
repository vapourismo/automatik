"use strict";

var GroupContainer = React.createClass({
	displayName: "GroupContainer",

	getInitialState: function getInitialState() {
		return { groups: [], showTempTile: false };
	},

	requestGroups: function requestGroups() {
		serverSocket.emit("ListGroups");
	},

	onSubmitAddGroup: function onSubmitAddGroup(name) {
		serverSocket.emit("AddGroup", name);
		this.setState({ showTempTile: false });
	},

	onCancelAddGroup: function onCancelAddGroup(name) {
		this.setState({ showTempTile: false });
	},

	onClickAddGroup: function onClickAddGroup() {
		this.setState({ showTempTile: true });
	},

	componentDidMount: function componentDidMount() {
		this.eventHandlers = {
			listGroups: (function (groups) {
				this.setState({
					groups: groups.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					})
				});
			}).bind(this),

			updateGroups: this.requestGroups
		};

		serverSocket.on("ListGroups", this.eventHandlers.listGroups);
		serverSocket.on("UpdateGroups", this.eventHandlers.updateGroups);

		this.requestGroups();
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("ListGroups", this.eventHandlers.listGroups);
		serverSocket.removeListener("UpdateGroups", this.eventHandlers.updateGroups);
	},

	render: function render() {
		var tiles = this.state.groups.map(function (group) {
			return React.createElement(GroupTile, { key: group.id, info: group });
		});

		if (this.state.showTempTile) {
			tiles.push(React.createElement(EditableGroupTile, { key: "edit-group", onSubmit: this.onSubmitAddGroup, onCancel: this.onCancelAddGroup }));
		} else {
			tiles.push(React.createElement(
				Tile,
				{ key: "add-group" },
				React.createElement(
					"a",
					{ className: "add-tile", onClick: this.onClickAddGroup },
					React.createElement("i", { className: "fa fa-plus" })
				)
			));
		}

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
		React.createElement(GroupContainer, null),
		React.createElement(Notifier, null)
	), document.body);
});
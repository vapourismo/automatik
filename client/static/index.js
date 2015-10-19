"use strict";

var GroupContainer = React.createClass({
	displayName: "GroupContainer",

	getInitialState: function getInitialState() {
		return { groups: [], showTempTile: false };
	},

	requestSubGroups: function requestSubGroups() {
		serverSocket.emit("ListSubGroups", this.props.group);
	},

	onSubmitAddGroup: function onSubmitAddGroup(name) {
		serverSocket.emit("CreateGroup", { name: name, parent: this.props.group });
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
			listSubGroups: (function (info) {
				if (info.group != this.props.group) return;

				this.setState({
					groups: info.subGroups.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					})
				});
			}).bind(this),

			updateGroup: (function (group) {
				if (group == this.props.group) this.requestSubGroups();
			}).bind(this)
		};

		serverSocket.on("ListSubGroups", this.eventHandlers.listSubGroups);
		serverSocket.on("UpdateGroup", this.eventHandlers.updateGroup);

		this.requestSubGroups();
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("ListSubGroups", this.eventHandlers.listSubGroups);
		serverSocket.removeListener("UpdateGroup", this.eventHandlers.updateGroup);
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
		React.createElement(GroupContainer, { group: null }),
		React.createElement(Notifier, null)
	), document.getElementById("canvas"));
});
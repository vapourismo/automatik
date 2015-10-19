"use strict";

var serverSocket = io();

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

var GroupTileMode = {
	Normal: 1,
	Context: 2,
	Delete: 3,
	Rename: 4
};

var GroupTile = React.createClass({
	displayName: "GroupTile",

	getInitialState: function getInitialState() {
		return {
			mode: GroupTileMode.Normal
		};
	},

	onContextMenu: function onContextMenu(ev) {
		ev.preventDefault();
		this.setState({ mode: GroupTileMode.Context });

		var ctxEvent = new Event("OpenGroupContext");
		ctxEvent.sender = this;

		window.dispatchEvent(ctxEvent);
	},

	onRequestDelete: function onRequestDelete() {
		this.setState({ mode: GroupTileMode.Delete });
	},

	onConfirmDelete: function onConfirmDelete() {
		serverSocket.emit("DeleteGroup", this.props.info.id);
		this.setState({ mode: GroupTileMode.Normal });
	},

	onRequestRename: function onRequestRename() {
		this.setState({ mode: GroupTileMode.Rename });
	},

	focusRenameInput: function focusRenameInput() {
		this.refs.name.select();
	},

	onSubmitRename: function onSubmitRename(ev) {
		serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: this.refs.name.value
		});

		this.setState({ mode: GroupTileMode.Normal });
		if (ev) ev.preventDefault();
	},

	componentDidMount: function componentDidMount() {
		this.eventHandlers = {
			openGroupContext: (function (ev) {
				if (ev.sender != this) this.setState({ mode: GroupTileMode.Normal });
			}).bind(this),

			escape: (function () {
				this.setState({ mode: GroupTileMode.Normal });
			}).bind(this)
		};

		window.addEventListener("OpenGroupContext", this.eventHandlers.openGroupContext);
		window.addEventListener("Escape", this.eventHandlers.escape);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenGroupContext", this.eventHandlers.openGroupContext);
		window.removeEventListener("Escape", this.eventHandlers.escape);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Normal:
				content = React.createElement(
					"a",
					{ className: "box group", onContextMenu: this.onContextMenu },
					this.props.info.name
				);

				break;

			case GroupTileMode.Context:
				content = React.createElement(
					"div",
					{ className: "box context" },
					React.createElement(
						"li",
						{ onClick: this.onRequestDelete, className: "first" },
						"Delete"
					),
					React.createElement(
						"li",
						{ onClick: this.onRequestRename },
						"Rename"
					)
				);

				break;

			case GroupTileMode.Delete:
				content = React.createElement(
					"a",
					{ className: "box delete-group", onClick: this.onConfirmDelete },
					React.createElement(
						"span",
						null,
						"Are you sure?"
					)
				);

				break;

			case GroupTileMode.Rename:
				content = React.createElement(
					"form",
					{ className: "box add-group", onClick: this.focusRenameInput, onSubmit: this.onSubmitRename },
					React.createElement("input", { className: "name", ref: "name", type: "text", defaultValue: this.props.info.name, onBlur: this.onSubmitRename })
				);

				break;
		}

		return React.createElement(
			Tile,
			null,
			content
		);
	},

	componentDidUpdate: function componentDidUpdate() {
		if (this.state.mode == GroupTileMode.Rename) this.focusRenameInput();
	}
});

var EditableGroupTile = React.createClass({
	displayName: "EditableGroupTile",

	onKey: function onKey(ev) {
		if (ev.keyCode == 27) this.props.onCancel();else if (ev.keyCode == 13) this.props.onSubmit(this.refs.name.value);
	},

	componentDidMount: function componentDidMount() {
		this.refs.name.focus();
	},

	render: function render() {
		return React.createElement(
			Tile,
			null,
			React.createElement(
				"div",
				{ className: "box add-group" },
				React.createElement("input", { className: "name", ref: "name", type: "text", onKeyUp: this.onKey, onBlur: this.props.onCancel })
			)
		);
	}
});

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
	ReactDOM.render(React.createElement(GroupContainer, null), document.getElementById("canvas"));
	ReactDOM.render(React.createElement(Notifier, null), document.getElementById("notifications"));
});

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27) window.dispatchEvent(new Event("Escape"));
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body) window.dispatchEvent(new Event("Escape"));
});
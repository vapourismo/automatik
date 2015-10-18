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

var RoomTileMode = {
	Normal: 1,
	ContextMenu: 2,
	Delete: 3,
	Rename: 4
};

var RoomTile = React.createClass({
	displayName: "RoomTile",

	getInitialState: function getInitialState() {
		return {
			mode: RoomTileMode.Normal
		};
	},

	onContextMenu: function onContextMenu(ev) {
		ev.preventDefault();
		this.setState({ mode: RoomTileMode.ContextMenu });

		var ctxEvent = new Event("OpenRoomContext");
		ctxEvent.sender = this;

		window.dispatchEvent(ctxEvent);
	},

	onRequestDelete: function onRequestDelete() {
		this.setState({ mode: RoomTileMode.Delete });
	},

	onConfirmDelete: function onConfirmDelete() {
		serverSocket.emit("DeleteRoom", this.props.info.id);
		this.setState({ mode: RoomTileMode.Normal });
	},

	onRequestRename: function onRequestRename() {
		this.setState({ mode: RoomTileMode.Rename });
	},

	focusRenameInput: function focusRenameInput() {
		this.refs.name.select();
	},

	onSubmitRename: function onSubmitRename(ev) {
		serverSocket.emit("RenameRoom", {
			id: this.props.info.id,
			name: this.refs.name.value
		});

		this.setState({ mode: RoomTileMode.Normal });
		if (ev) ev.preventDefault();
	},

	// onCancelRename: function () {
	// 	this.setState({mode: RoomTileMode.Normal});
	// },

	componentDidMount: function componentDidMount() {
		this.eventHandlers = {
			openRoomContext: (function (ev) {
				if (ev.sender != this) this.setState({ mode: RoomTileMode.Normal });
			}).bind(this),

			escape: (function () {
				this.setState({ mode: RoomTileMode.Normal });
			}).bind(this)
		};

		window.addEventListener("OpenRoomContext", this.eventHandlers.openRoomContext);
		window.addEventListener("Escape", this.eventHandlers.escape);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenRoomContext", this.eventHandlers.openRoomContext);
		window.removeEventListener("Escape", this.eventHandlers.escape);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case RoomTileMode.Normal:
				content = React.createElement(
					"a",
					{ className: "box room", onContextMenu: this.onContextMenu },
					this.props.info.name
				);

				break;

			case RoomTileMode.ContextMenu:
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

			case RoomTileMode.Delete:
				content = React.createElement(
					"a",
					{ className: "box delete-room", onClick: this.onConfirmDelete },
					React.createElement(
						"span",
						null,
						"Are you sure?"
					)
				);

				break;

			case RoomTileMode.Rename:
				content = React.createElement(
					"form",
					{ className: "box add-room", onClick: this.focusRenameInput, onSubmit: this.onSubmitRename },
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
		if (this.state.mode == RoomTileMode.Rename) this.focusRenameInput();
	}
});

var EditableRoomTile = React.createClass({
	displayName: "EditableRoomTile",

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
				{ className: "box add-room" },
				React.createElement("input", { className: "name", ref: "name", type: "text", onKeyUp: this.onKey, onBlur: this.props.onCancel })
			)
		);
	}
});

var RoomContainer = React.createClass({
	displayName: "RoomContainer",

	getInitialState: function getInitialState() {
		return { rooms: [], showTempTile: false };
	},

	requestRooms: function requestRooms() {
		serverSocket.emit("ListRooms");
	},

	onSubmitAddRoom: function onSubmitAddRoom(name) {
		serverSocket.emit("AddRoom", name);
		this.setState({ showTempTile: false });
	},

	onCancelAddRoom: function onCancelAddRoom(name) {
		this.setState({ showTempTile: false });
	},

	onClickAddRoom: function onClickAddRoom() {
		this.setState({ showTempTile: true });
	},

	componentDidMount: function componentDidMount() {
		this.eventHandlers = {
			listRooms: (function (rooms) {
				this.setState({
					rooms: rooms.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					})
				});
			}).bind(this),

			updateRooms: this.requestRooms
		};

		serverSocket.on("ListRooms", this.eventHandlers.listRooms);
		serverSocket.on("UpdateRooms", this.eventHandlers.updateRooms);

		this.requestRooms();
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("ListRooms", this.eventHandlers.listRooms);
		serverSocket.removeListener("UpdateRooms", this.eventHandlers.updateRooms);
	},

	render: function render() {
		var tiles = this.state.rooms.map(function (room) {
			return React.createElement(RoomTile, { key: room.id, info: room });
		});

		if (this.state.showTempTile) {
			tiles.push(React.createElement(EditableRoomTile, { key: "edit-room", onSubmit: this.onSubmitAddRoom, onCancel: this.onCancelAddRoom }));
		} else {
			tiles.push(React.createElement(
				Tile,
				{ key: "add-room" },
				React.createElement(
					"a",
					{ className: "add-tile", onClick: this.onClickAddRoom },
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
	ReactDOM.render(React.createElement(RoomContainer, null), document.getElementById("canvas"));
	ReactDOM.render(React.createElement(Notifier, null), document.getElementById("notifications"));
});

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27) window.dispatchEvent(new Event("Escape"));
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body) window.dispatchEvent(new Event("Escape"));
});
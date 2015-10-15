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

var RoomTile = React.createClass({
	displayName: "RoomTile",

	render: function render() {
		return React.createElement(
			Tile,
			null,
			React.createElement(
				"a",
				{ className: "box room" },
				this.props.children
			)
		);
	}
});

var EditableRoomTile = React.createClass({
	displayName: "EditableRoomTile",

	onClickBox: function onClickBox() {
		this.refs.name.focus();
	},

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
				{ className: "box add-room", onClick: this.onClickBox },
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
		serverSocket.on("ListRooms", (function (rooms) {
			this.setState({ rooms: rooms });
		}).bind(this));

		this.requestRooms();
	},

	render: function render() {
		var tiles = this.state.rooms.map(function (room) {
			return React.createElement(
				RoomTile,
				{ roomID: room.id },
				room.name
			);
		});

		if (this.state.showTempTile) {
			tiles.push(React.createElement(EditableRoomTile, { onSubmit: this.onSubmitAddRoom, onCancel: this.onCancelAddRoom }));
		} else {
			tiles.push(React.createElement(
				Tile,
				null,
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
			{ className: "notification" },
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
		serverSocket.on("DisplayError", (function (err) {
			this.setState({
				notifications: this.state.notifications.concat([React.createElement(
					Notification,
					null,
					err
				)])
			});

			setTimeout(this.onDecay.bind(this), 15000);
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
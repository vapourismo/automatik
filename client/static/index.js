"use strict";

var serverSocket = io();

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

var RoomContainer = React.createClass({
	displayName: "RoomContainer",

	getInitialState: function getInitialState() {
		return { rooms: [] };
	},

	componentDidMount: function componentDidMount() {
		serverSocket.on("ListRooms", (function (rooms) {
			this.setState({ rooms: rooms });
		}).bind(this));

		serverSocket.emit("ListRooms");
	},

	render: function render() {
		var tiles = this.state.rooms.map(function (room) {
			return React.createElement(
				RoomTile,
				{ roomID: room.id },
				room.name
			);
		});

		return React.createElement(
			Container,
			null,
			tiles
		);
	}
});

function renderCanvas(contents) {
	ReactDOM.render(contents, document.getElementById("canvas"));
}

window.addEventListener("load", function () {
	if (window.location.hash) {} else {
		renderCanvas(React.createElement(RoomContainer, null));
	}
});
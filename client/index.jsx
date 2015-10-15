var serverSocket = io();

var RoomTile = React.createClass({
	render: function () {
		return (
			<Tile>
				<a className="box room">
					{this.props.children}
				</a>
			</Tile>
		);
	}
});

var RoomContainer = React.createClass({
	getInitialState: function () {
		return {rooms: []};
	},

	requestRooms: function () {
		serverSocket.emit("ListRooms");
	},

	componentDidMount: function () {
		serverSocket.on("ListRooms", function (rooms) {
			this.setState({rooms: rooms});
		}.bind(this));

		this.requestRooms();
	},

	render: function () {
		var tiles = this.state.rooms.map(function (room) {
			return <RoomTile roomID={room.id}>{room.name}</RoomTile>;
		});

		return <Container>{tiles}</Container>;
	}
});

function renderCanvas(contents) {
	ReactDOM.render(contents, document.getElementById("canvas"));
}

window.addEventListener("load", function () {
	if (window.location.hash) {

	} else {
		renderCanvas(<RoomContainer />);
	}
});

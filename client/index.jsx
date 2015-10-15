var serverSocket = io();

function renderCanvas(contents) {
	ReactDOM.render(contents, document.getElementById("canvas"));
}

var Tile = React.createClass({
	render: function () {
		return <div className="tile">{this.props.children}</div>;
	}
});

var Container = React.createClass({
	render: function () {
		return <div className="container">{this.props.children}</div>;
	}
});

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

var EditableRoomTile = React.createClass({
	onClickBox: function () {
		this.refs.name.focus();
	},

	onKeyPress: function (ev) {
		if (ev.charCode == 13) this.props.onSubmit(this.refs.name.value);
	},

	componentDidMount: function () {
		this.refs.name.focus();
	},

	render: function () {
		return (
			<Tile>
				<div className="box add-room" onClick={this.onClickBox}>
					<input className="name" ref="name" type="text" onKeyPress={this.onKeyPress} />
				</div>
			</Tile>
		);
	}
});

var RoomContainer = React.createClass({
	getInitialState: function () {
		return {rooms: [], showTempTile: false};
	},

	requestRooms: function () {
		serverSocket.emit("ListRooms");
	},

	onSubmitAddRoom: function (name) {
		serverSocket.emit("AddRoom", name);
		this.setState({showTempTile: false});
	},

	onClickAddRoom: function () {
		this.setState({showTempTile: true});
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

		if (this.state.showTempTile) {
			tiles.push(<EditableRoomTile onSubmit={this.onSubmitAddRoom}/>);
		} else {
			tiles.push(
				<Tile>
					<a className="add-tile" onClick={this.onClickAddRoom}>
						<i className="fa fa-plus"></i>
					</a>
				</Tile>
			);
		}

		return <Container>{tiles}</Container>;
	}
});

window.addEventListener("load", function () {
	renderCanvas(<RoomContainer />);
});

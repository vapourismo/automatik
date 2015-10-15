var serverSocket = io();

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

	onKey: function (ev) {
		if (ev.keyCode == 27) this.props.onCancel();
		else if (ev.keyCode == 13) this.props.onSubmit(this.refs.name.value);
	},

	componentDidMount: function () {
		this.refs.name.focus();
	},

	render: function () {
		return (
			<Tile>
				<div className="box add-room" onClick={this.onClickBox}>
					<input className="name" ref="name" type="text" onKeyUp={this.onKey}  onBlur={this.props.onCancel}/>
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

	onCancelAddRoom: function (name) {
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
			tiles.push(<EditableRoomTile onSubmit={this.onSubmitAddRoom} onCancel={this.onCancelAddRoom}/>);
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

var Notification = React.createClass({
	render: function () {
		return (
			<div className="notification">
				{this.props.children}
			</div>
		);
	}
});

var Notifier = React.createClass({
	getInitialState: function () {
		return {
			notifications: []
		};
	},

	onDecay: function () {
		this.setState({
			notifications: this.state.notifications.slice(1)
		});
	},

	componentDidMount: function () {
		serverSocket.on("DisplayError", function (err) {
			this.setState({
				notifications: this.state.notifications.concat([
					<Notification>{err}</Notification>
				])
			});

			setTimeout(this.onDecay.bind(this), 15000);
		}.bind(this));
	},

	render: function () {
		return <div className="notifier">{this.state.notifications}</div>;
	}
});

window.addEventListener("load", function () {
	ReactDOM.render(<RoomContainer />, document.getElementById("canvas"));
	ReactDOM.render(<Notifier />, document.getElementById("notifications"));
});

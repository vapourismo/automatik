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

var RoomTileMode = {
	Normal:        1,
	ContextMenu:   2,
	ConfirmDelete: 3
};

var RoomTile = React.createClass({
	getInitialState: function () {
		return {
			mode: RoomTileMode.Normal
		};
	},

	onContextMenu: function (ev) {
		ev.preventDefault();
		this.setState({mode: RoomTileMode.ContextMenu});

		var ctxEvent = new Event("OpenRoomContextMenu");
		ctxEvent.sender = this;

		window.dispatchEvent(ctxEvent);
	},

	onRequestDelete: function () {
		this.setState({mode: RoomTileMode.ConfirmDelete});
	},

	onConfirmDelete: function () {
		this.setState({mode: RoomTileMode.Normal});
		serverSocket.emit("DeleteRoom", this.props.info.id);
	},

	componentDidMount: function () {
		window.addEventListener("OpenRoomContextMenu", function (ev) {
			if (ev.sender != this) this.setState({mode: RoomTileMode.Normal});
		}.bind(this));

		window.addEventListener("Escape", function () {
			this.setState({mode: RoomTileMode.Normal});
		}.bind(this));
	},

	render: function () {
		var content;

		switch (this.state.mode) {
			case RoomTileMode.Normal:
				content = (
					<a className="box room" onContextMenu={this.onContextMenu}>
						{this.props.info.name}
					</a>
				);

				break;

			case RoomTileMode.ContextMenu:
				content = (
					<div className="box context">
						<li onClick={this.onRequestDelete} className="first">Delete</li>
						<li>Rename</li>
					</div>
				);

				break;

			case RoomTileMode.ConfirmDelete:
				content = (
					<a className="box delete-room" onClick={this.onConfirmDelete}>
						<span>Are you sure?</span>
					</a>
				);

				break;
		}

		return <Tile>{content}</Tile>;
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
					<input className="name" ref="name" type="text" onKeyUp={this.onKey} onBlur={this.props.onCancel}/>
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
			this.setState({
				rooms: rooms.sort(function (a, b) {
					return a.name.localeCompare(b.name);
				})
			});
		}.bind(this));

		serverSocket.on("UpdateRooms", this.requestRooms);

		this.requestRooms();
	},

	render: function () {
		var tiles = this.state.rooms.map(function (room) {
			return <RoomTile key={room.id} info={room}/>;
		});

		if (this.state.showTempTile) {
			tiles.push(
				<EditableRoomTile key="edit-room" onSubmit={this.onSubmitAddRoom} onCancel={this.onCancelAddRoom}/>
			);
		} else {
			tiles.push(
				<Tile key="add-room">
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

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27) window.dispatchEvent(new Event("Escape"));
});

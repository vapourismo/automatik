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
	Normal:      1,
	ContextMenu: 2,
	Delete:      3,
	Rename:      4
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

		var ctxEvent = new Event("OpenRoomContext");
		ctxEvent.sender = this;

		window.dispatchEvent(ctxEvent);
	},

	onRequestDelete: function () {
		this.setState({mode: RoomTileMode.Delete});
	},

	onConfirmDelete: function () {
		serverSocket.emit("DeleteRoom", this.props.info.id);
		this.setState({mode: RoomTileMode.Normal});
	},

	onRequestRename: function () {
		this.setState({mode: RoomTileMode.Rename});
	},

	focusRenameInput: function () {
		this.refs.name.select();
	},

	onSubmitRename: function (ev) {
		serverSocket.emit("RenameRoom", {
			id: this.props.info.id,
			name: this.refs.name.value
		});

		this.setState({mode: RoomTileMode.Normal});
		if (ev) ev.preventDefault();
	},

	// onCancelRename: function () {
	// 	this.setState({mode: RoomTileMode.Normal});
	// },

	componentDidMount: function () {
		this.eventHandlers = {
			openRoomContext: function (ev) {
				if (ev.sender != this) this.setState({mode: RoomTileMode.Normal});
			}.bind(this),

			escape: function () {
				this.setState({mode: RoomTileMode.Normal});
			}.bind(this)
		};

		window.addEventListener("OpenRoomContext", this.eventHandlers.openRoomContext);
		window.addEventListener("Escape",          this.eventHandlers.escape);
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenRoomContext", this.eventHandlers.openRoomContext);
		window.removeEventListener("Escape",          this.eventHandlers.escape);
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
						<li onClick={this.onRequestRename}>Rename</li>
					</div>
				);

				break;

			case RoomTileMode.Delete:
				content = (
					<a className="box delete-room" onClick={this.onConfirmDelete}>
						<span>Are you sure?</span>
					</a>
				);

				break;

			case RoomTileMode.Rename:
				content = (
					<form className="box add-room" onClick={this.focusRenameInput} onSubmit={this.onSubmitRename}>
						<input className="name" ref="name" type="text" defaultValue={this.props.info.name} onBlur={this.onSubmitRename}/>
					</form>
				);

				break;
		}

		return <Tile>{content}</Tile>;
	},

	componentDidUpdate: function () {
		if (this.state.mode == RoomTileMode.Rename)
			this.focusRenameInput();
	}
});

var EditableRoomTile = React.createClass({
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
				<div className="box add-room">
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
		this.eventHandlers = {
			listRooms: function (rooms) {
				this.setState({
					rooms: rooms.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					})
				});
			}.bind(this),

			updateRooms: this.requestRooms
		};

		serverSocket.on("ListRooms",   this.eventHandlers.listRooms);
		serverSocket.on("UpdateRooms", this.eventHandlers.updateRooms);

		this.requestRooms();
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("ListRooms",   this.eventHandlers.listRooms);
		serverSocket.removeListener("UpdateRooms", this.eventHandlers.updateRooms);
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
			<div className="notification fade-out">
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
		var counter = 0;

		serverSocket.on("DisplayError", function (err) {
			this.setState({
				notifications: this.state.notifications.concat([
					<Notification key={counter++}>{err}</Notification>
				])
			});

			setTimeout(this.onDecay, 15000);
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
	if (ev.keyCode == 27)
		window.dispatchEvent(new Event("Escape"));
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body)
		window.dispatchEvent(new Event("Escape"));
});

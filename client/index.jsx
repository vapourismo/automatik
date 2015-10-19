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

var GroupTileMode = {
	Normal:  1,
	Context: 2,
	Delete:  3,
	Rename:  4
};

var GroupTile = React.createClass({
	getInitialState: function () {
		return {
			mode: GroupTileMode.Normal
		};
	},

	onContextMenu: function (ev) {
		ev.preventDefault();
		this.setState({mode: GroupTileMode.Context});

		var ctxEvent = new Event("OpenGroupContext");
		ctxEvent.sender = this;

		window.dispatchEvent(ctxEvent);
	},

	onRequestDelete: function () {
		this.setState({mode: GroupTileMode.Delete});
	},

	onConfirmDelete: function () {
		serverSocket.emit("DeleteGroup", this.props.info.id);
		this.setState({mode: GroupTileMode.Normal});
	},

	onRequestRename: function () {
		this.setState({mode: GroupTileMode.Rename});
	},

	focusRenameInput: function () {
		this.refs.name.select();
	},

	onSubmitRename: function (ev) {
		serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: this.refs.name.value
		});

		this.setState({mode: GroupTileMode.Normal});
		if (ev) ev.preventDefault();
	},

	componentDidMount: function () {
		this.eventHandlers = {
			openGroupContext: function (ev) {
				if (ev.sender != this) this.setState({mode: GroupTileMode.Normal});
			}.bind(this),

			escape: function () {
				this.setState({mode: GroupTileMode.Normal});
			}.bind(this)
		};

		window.addEventListener("OpenGroupContext", this.eventHandlers.openGroupContext);
		window.addEventListener("Escape",           this.eventHandlers.escape);
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenGroupContext", this.eventHandlers.openGroupContext);
		window.removeEventListener("Escape",           this.eventHandlers.escape);
	},

	render: function () {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Normal:
				content = (
					<a className="box group" onContextMenu={this.onContextMenu}>
						{this.props.info.name}
					</a>
				);

				break;

			case GroupTileMode.Context:
				content = (
					<div className="box context">
						<li onClick={this.onRequestDelete} className="first">Delete</li>
						<li onClick={this.onRequestRename}>Rename</li>
					</div>
				);

				break;

			case GroupTileMode.Delete:
				content = (
					<a className="box delete-group" onClick={this.onConfirmDelete}>
						<span>Are you sure?</span>
					</a>
				);

				break;

			case GroupTileMode.Rename:
				content = (
					<form className="box add-group" onClick={this.focusRenameInput} onSubmit={this.onSubmitRename}>
						<input className="name" ref="name" type="text" defaultValue={this.props.info.name} onBlur={this.onSubmitRename}/>
					</form>
				);

				break;
		}

		return <Tile>{content}</Tile>;
	},

	componentDidUpdate: function () {
		if (this.state.mode == GroupTileMode.Rename)
			this.focusRenameInput();
	}
});

var EditableGroupTile = React.createClass({
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
				<div className="box add-group">
					<input className="name" ref="name" type="text" onKeyUp={this.onKey} onBlur={this.props.onCancel}/>
				</div>
			</Tile>
		);
	}
});

var GroupContainer = React.createClass({
	getInitialState: function () {
		return {groups: [], showTempTile: false};
	},

	requestGroups: function () {
		serverSocket.emit("ListGroups");
	},

	onSubmitAddGroup: function (name) {
		serverSocket.emit("AddGroup", name);
		this.setState({showTempTile: false});
	},

	onCancelAddGroup: function (name) {
		this.setState({showTempTile: false});
	},

	onClickAddGroup: function () {
		this.setState({showTempTile: true});
	},

	componentDidMount: function () {
		this.eventHandlers = {
			listGroups: function (groups) {
				this.setState({
					groups: groups.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					})
				});
			}.bind(this),

			updateGroups: this.requestGroups
		};

		serverSocket.on("ListGroups",   this.eventHandlers.listGroups);
		serverSocket.on("UpdateGroups", this.eventHandlers.updateGroups);

		this.requestGroups();
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("ListGroups",   this.eventHandlers.listGroups);
		serverSocket.removeListener("UpdateGroups", this.eventHandlers.updateGroups);
	},

	render: function () {
		var tiles = this.state.groups.map(function (group) {
			return <GroupTile key={group.id} info={group}/>;
		});

		if (this.state.showTempTile) {
			tiles.push(
				<EditableGroupTile key="edit-group" onSubmit={this.onSubmitAddGroup} onCancel={this.onCancelAddGroup}/>
			);
		} else {
			tiles.push(
				<Tile key="add-group">
					<a className="add-tile" onClick={this.onClickAddGroup}>
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
	ReactDOM.render(<GroupContainer />, document.getElementById("canvas"));
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

var GroupTileMode = {
	Normal:  1,
	Waiting: 2,
	Context: 3,
	Delete:  4,
	Rename:  5
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
		this.setState({mode: GroupTileMode.Waiting});
		serverSocket.emit("DeleteGroup", this.props.info.id);
	},

	onRequestRename: function () {
		this.setState({mode: GroupTileMode.Rename});
	},

	focusRenameInput: function () {
		this.refs.name.select();
	},

	onSubmitRename: function (ev) {
		this.setState({mode: GroupTileMode.Waiting});
		serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: this.refs.name.value
		});

		if (ev) ev.preventDefault();
		return false;
	},

	onOpenGroupContext: function (ev) {
		if (ev.sender != this) this.setState({mode: GroupTileMode.Normal});
	},

	onEscape: function () {
		if (this.state.mode > GroupTileMode.Waiting)
			this.setState({mode: GroupTileMode.Normal});
	},

	componentDidMount: function () {
		window.addEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.addEventListener("Escape",           this.onEscape);
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.removeEventListener("Escape",           this.onEscape);
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

			case GroupTileMode.Waiting:
				content = (
					<div className="box group">
						<i className="fa fa-refresh rotate"></i>
					</div>
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

var AddGroupTile = React.createClass({
	getInitialState: function () {
		return {
			editing: false
		};
	},

	onRequestEditing: function () {
		this.setState({editing: true});
	},

	onSubmit: function (ev) {
		serverSocket.emit("CreateGroup", {name: this.refs.name.value, parent: this.props.group});
		this.setState({editing: false});

		if (ev) ev.preventDefault();
		return false;
	},

	onCancel: function () {
		this.setState({editing: false});
	},

	componentDidMount: function () {
		window.addEventListener("OpenGroupContext", this.onCancel);
		window.addEventListener("Escape",           this.onCancel);
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenGroupContext", this.onCancel);
		window.removeEventListener("Escape",           this.onCancel);
	},

	render: function () {
		if (this.state.editing) {
			return (
				<Tile>
					<form className="box add-group" onSubmit={this.onSubmit}>
						<input className="name" ref="name" type="text" onBlur={this.onCancel}/>
					</form>
				</Tile>
			);
		} else {
			return (
				<Tile>
					<a className="add-tile" onClick={this.onRequestEditing}>
						<i className="fa fa-plus"></i>
					</a>
				</Tile>
			);
		}
	},

	componentDidUpdate: function () {
		if (this.state.editing) this.refs.name.focus();
	}
});

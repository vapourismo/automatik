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

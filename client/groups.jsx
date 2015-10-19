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

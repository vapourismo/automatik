var InputGroupBox = React.createClass({
	onRequestEditing: function () {
		this.setState({editing: true});
	},

	onSubmit: function (ev) {
		this.props.onSubmit(this.refs.name.value);

		if (ev) ev.preventDefault();
		return false;
	},

	onCancel: function (ev) {
		if (this.props.onCancel)
			this.props.onCancel(this.refs.name.value);

		if (ev) ev.preventDefault();
		return false;
	},

	componentDidMount: function () {
		window.addEventListener("OpenGroupContext", this.onCancel);
		window.addEventListener("Escape",           this.onCancel);

		this.refs.name.select();
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenGroupContext", this.onCancel);
		window.removeEventListener("Escape",           this.onCancel);
	},

	render: function () {
		return (
			<form className="box input-group" onSubmit={this.onSubmit}>
				<input ref="name" type="text" defaultValue={this.props.defaultValue} onBlur={this.onCancel}/>
			</form>
		);
	},

	componentDidUpdate: function () {
		this.refs.name.select();
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

	onSubmit: function (name) {
		serverSocket.emit("CreateGroup", {name: name, parent: this.props.group});
		this.setState({editing: false});
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
					<InputGroupBox onSubmit={this.onSubmit} onCancel={this.onCancel}/>
				</Tile>
			);
		} else {
			return (
				<Tile>
					<div className="box add-group" onClick={this.onRequestEditing}>
						<i className="fa fa-plus"></i>
					</div>
				</Tile>
			);
		}
	}
});

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

		window.dispatchEventEasily("OpenGroupContext", {
			sender: this
		});
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

	onSubmitRename: function (name) {
		this.setState({mode: GroupTileMode.Waiting});

		serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: name
		});
	},

	onOpenGroupContext: function (ev) {
		if (ev.sender != this) this.setState({mode: GroupTileMode.Normal});
	},

	onEscape: function () {
		if (this.state.mode > GroupTileMode.Waiting)
			this.setState({mode: GroupTileMode.Normal});
	},

	onUpdateFailed: function (info) {
		if (info.id == this.props.info.id) {
			displayError(info.message);

			if (this.state.mode == GroupTileMode.Waiting)
				this.setState({mode: GroupTileMode.Normal});
		}
	},

	onUpdate: function (id) {
		if (id == this.props.info.id && this.state.mode == GroupTileMode.Waiting)
			this.setState({mode: GroupTileMode.Normal});
	},

	componentDidMount: function () {
		window.addEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.addEventListener("Escape",           this.onEscape);

		serverSocket.on("UpdateGroup",       this.onUpdate);
		serverSocket.on("UpdateGroupFailed", this.onUpdateFailed);
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.removeEventListener("Escape",           this.onEscape);

		serverSocket.removeListener("UpdateGroup",       this.onUpdate);
		serverSocket.removeListener("UpdateGroupFailed", this.onUpdateFailed);
	},

	render: function () {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Normal:
				content = (
					<div className="box group" onContextMenu={this.onContextMenu}>
						{this.props.info.name}
					</div>
				);

				break;

			case GroupTileMode.Context:
				content = (
					<div className="box context">
						<li onClick={this.onRequestDelete}>Delete</li>
						<li onClick={this.onRequestRename}>Rename</li>
					</div>
				);

				break;

			case GroupTileMode.Delete:
				content = (
					<div className="box delete-group" onClick={this.onConfirmDelete}>
						<span>Are you sure?</span>
					</div>
				);

				break;

			case GroupTileMode.Rename:
				content = (
		           <InputGroupBox defaultValue={this.props.info.name} onSubmit={this.onSubmitRename}/>
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
	}
});

var GroupContainer = React.createClass({
	getInitialState: function () {
		return {groups: [], showTempTile: false};
	},

	requestSubGroups: function () {
		serverSocket.emit("ListSubGroups", this.props.group);
	},

	onListSubGroups: function (info) {
		if (info.id != this.props.group)
			return;

		this.setState({
			groups: info.subGroups.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			})
		});
	},

	onUpdateGroup: function (id) {
		if (id == this.props.group)
			this.requestSubGroups();
	},

	componentDidMount: function () {
		serverSocket.on("ListSubGroups", this.onListSubGroups);
		serverSocket.on("UpdateGroup",   this.onUpdateGroup);

		if (!this.counter) this.counter = 0;
		this.requestSubGroups();
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("ListSubGroups", this.onListSubGroups);
		serverSocket.removeListener("UpdateGroup",   this.onUpdateGroup);
	},

	render: function () {
		var tiles = this.state.groups.map(function (group) {
			return <GroupTile key={this.counter++} info={group}/>;
		}.bind(this));

		tiles.push(<AddGroupTile key="add-group" group={this.props.group}/>);

		return <Container>{tiles}</Container>;
	}
});

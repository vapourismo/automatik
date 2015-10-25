const AddGroupBox = React.createClass({
	onSubmit: function (name) {
		serverSocket.emit("CreateGroup", {name: name, parent: this.props.parent});
		this.props.onSubmit();
	},

	render: function () {
		return <InputBox onSubmit={this.onSubmit} onCancel={this.props.onCancel}/>
	}
});

const AddElementTileMode = {
	Normal:    1,
	Context:   2,
	Group:     3,
	Component: 4
};

const AddElementTile = React.createClass({
	getInitialState: function () {
		return {
			mode: AddElementTileMode.Normal
		};
	},

	onRequestNormal: function () {
		this.setState({
			mode: AddElementTileMode.Normal
		});
	},

	onOpenContext: function (ev) {
		if (ev.sender != this) this.onRequestNormal();
	},

	onRequestContext: function () {
		window.dispatchEventEasily("OpenContext", {
			sender: this
		});

		this.setState({
			mode: AddElementTileMode.Context
		});
	},

	onRequestGroup: function () {
		this.setState({
			mode: AddElementTileMode.Group
		});
	},

	componentDidMount: function () {
		window.addEventListener("OpenContext", this.onOpenContext);
		window.addEventListener("Escape",      this.onRequestNormal);

		this.contextItems = {
			"Group": this.onRequestGroup
		};
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape",      this.onRequestNormal);
	},

	render: function () {
		var content;

		switch (this.state.mode) {
			case AddElementTileMode.Group:
				content = (
					<AddGroupBox parent={this.props.parent}
					             onSubmit={this.onRequestNormal}
					             onCancel={this.onRequestNormal}/>
				);

				break;

			case AddElementTileMode.Context:
				content = <ContextBox items={this.contextItems}/>;

				break;

			default:
				content = (
					<div className="box element-action normal" onClick={this.onRequestContext}>
						<i className="fa fa-plus"></i>
					</div>
				);

				break;
		}

		return <Tile>{content}</Tile>
	}
});

const GroupTileMode = {
	Normal:  1,
	Waiting: 2,
	Context: 3,
	Delete:  4,
	Rename:  5
};

const GroupTile = React.createClass({
	getInitialState: function () {
		return {
			mode: GroupTileMode.Normal
		};
	},

	onContextMenu: function (ev) {
		ev.preventDefault();
		this.setState({mode: GroupTileMode.Context});

		window.dispatchEventEasily("OpenContext", {
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

	onOpenContext: function (ev) {
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

	onClick: function () {
		page("/groups/" + this.props.info.id);
	},

	componentDidMount: function () {
		window.addEventListener("OpenContext", this.onOpenContext);
		window.addEventListener("Escape",      this.onEscape);

		serverSocket.on("UpdateGroup",       this.onUpdate);
		serverSocket.on("UpdateGroupFailed", this.onUpdateFailed);

		this.contextItems = {
			"Delete": this.onRequestDelete,
			"Rename": this.onRequestRename
		};
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape",      this.onEscape);

		serverSocket.removeListener("UpdateGroup",       this.onUpdate);
		serverSocket.removeListener("UpdateGroupFailed", this.onUpdateFailed);
	},

	render: function () {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Context:
				content = <ContextBox items={this.contextItems}/>;

				break;

			case GroupTileMode.Delete:
				content = <ConfirmBox onConfirm={this.onConfirmDelete}/>;

				break;

			case GroupTileMode.Rename:
				content = (
		           <InputBox defaultValue={this.props.info.name} onSubmit={this.onSubmitRename}/>
				);

				break;

			case GroupTileMode.Waiting:
				content = <WaitingBox />;

				break;

			default:
				content = (
					<div className="box normal" onContextMenu={this.onContextMenu} onClick={this.onClick}>
						{this.props.info.name}
					</div>
				);

				break;
		}

		return <Tile>{content}</Tile>;
	}
});

const ParentGroupTile = React.createClass({
	onClick: function () {
		page("/groups/" + this.props.group);
	},

	render: function () {
		return (
			<Tile>
				<div className="box group-action" onClick={this.onClick}>
					<i className="fa fa-arrow-left"></i>
				</div>
			</Tile>
		);
	}
});

const GroupContainer = React.createClass({
	getInitialState: function () {
		return {
			name: null,
			parent: null,
			subGroups: []
		};
	},

	requestSubGroups: function () {
		serverSocket.emit("GetGroupInfo", this.props.group);
	},

	onGetGroupInfo: function (info) {
		if (info.id != this.props.group)
			return;

		this.setState({
			name: info.name,
			parent: info.parent,
			subGroups: info.subGroups.sort((a, b) => a.name.localeCompare(b.name))
		});
	},

	onUpdateGroup: function (id) {
		if (id == this.props.group)
			this.requestSubGroups();
	},

	componentDidMount: function () {
		serverSocket.on("GetGroupInfo", this.onGetGroupInfo);
		serverSocket.on("UpdateGroup",  this.onUpdateGroup);

		this.requestSubGroups();
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("GetGroupInfo", this.onGetGroupInfo);
		serverSocket.removeListener("UpdateGroup",  this.onUpdateGroup);
	},

	render: function () {
		const tiles = this.state.subGroups.map(
			group => <GroupTile key={"group-tile-" + group.id} info={group}/>
		);

		const back = this.props.group != null ? <ParentGroupTile group={this.state.parent}/> : null;

		return (
			<Container>
				{back}
				{tiles}
				<AddElementTile key="add-group" parent={this.props.group}/>
			</Container>
		);
	}
});

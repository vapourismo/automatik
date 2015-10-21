"use strict";

var InputGroupBox = React.createClass({
	displayName: "InputGroupBox",

	onRequestEditing: function onRequestEditing() {
		this.setState({ editing: true });
	},

	onSubmit: function onSubmit(ev) {
		this.props.onSubmit(this.refs.name.value);

		if (ev) ev.preventDefault();
		return false;
	},

	onCancel: function onCancel(ev) {
		if (this.props.onCancel) this.props.onCancel(this.refs.name.value);

		if (ev) ev.preventDefault();
		return false;
	},

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenGroupContext", this.onCancel);
		window.addEventListener("Escape", this.onCancel);

		this.refs.name.select();
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenGroupContext", this.onCancel);
		window.removeEventListener("Escape", this.onCancel);
	},

	render: function render() {
		return React.createElement(
			"form",
			{ className: "box input-group", onSubmit: this.onSubmit },
			React.createElement("input", { ref: "name", type: "text", defaultValue: this.props.defaultValue, onBlur: this.onCancel })
		);
	},

	componentDidUpdate: function componentDidUpdate() {
		this.refs.name.select();
	}
});

var AddGroupBox = React.createClass({
	displayName: "AddGroupBox",

	onSubmit: function onSubmit(name) {
		serverSocket.emit("CreateGroup", { name: name, parent: this.props.parent });
		this.props.onSubmit();
	},

	render: function render() {
		return React.createElement(InputGroupBox, { onSubmit: this.onSubmit, onCancel: this.props.onCancel });
	}
});

var AddElementTileMode = {
	Normal: 1,
	Group: 2,
	Component: 3
};

var AddElementTile = React.createClass({
	displayName: "AddElementTile",

	getInitialState: function getInitialState() {
		return {
			mode: AddElementTileMode.Normal
		};
	},

	restoreNormal: function restoreNormal() {
		this.setState({ mode: AddElementTileMode.Normal });
	},

	requestGroup: function requestGroup() {
		this.setState({ mode: AddElementTileMode.Group });
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case AddElementTileMode.Group:
				content = React.createElement(AddGroupBox, { parent: this.props.parent, onSubmit: this.restoreNormal,
					onCancel: this.restoreNormal });

				break;

			default:
				content = React.createElement(
					"div",
					{ className: "box element-action", onClick: this.requestGroup },
					React.createElement("i", { className: "fa fa-plus" })
				);

				break;
		}

		return React.createElement(
			Tile,
			null,
			content
		);
	}
});

var GroupTileMode = {
	Normal: 1,
	Waiting: 2,
	Context: 3,
	Delete: 4,
	Rename: 5
};

var GroupTile = React.createClass({
	displayName: "GroupTile",

	getInitialState: function getInitialState() {
		return {
			mode: GroupTileMode.Normal
		};
	},

	onContextMenu: function onContextMenu(ev) {
		ev.preventDefault();
		this.setState({ mode: GroupTileMode.Context });

		window.dispatchEventEasily("OpenGroupContext", {
			sender: this
		});
	},

	onRequestDelete: function onRequestDelete() {
		this.setState({ mode: GroupTileMode.Delete });
	},

	onConfirmDelete: function onConfirmDelete() {
		this.setState({ mode: GroupTileMode.Waiting });
		serverSocket.emit("DeleteGroup", this.props.info.id);
	},

	onRequestRename: function onRequestRename() {
		this.setState({ mode: GroupTileMode.Rename });
	},

	onSubmitRename: function onSubmitRename(name) {
		this.setState({ mode: GroupTileMode.Waiting });

		serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: name
		});
	},

	onOpenGroupContext: function onOpenGroupContext(ev) {
		if (ev.sender != this) this.setState({ mode: GroupTileMode.Normal });
	},

	onEscape: function onEscape() {
		if (this.state.mode > GroupTileMode.Waiting) this.setState({ mode: GroupTileMode.Normal });
	},

	onUpdateFailed: function onUpdateFailed(info) {
		if (info.id == this.props.info.id) {
			displayError(info.message);

			if (this.state.mode == GroupTileMode.Waiting) this.setState({ mode: GroupTileMode.Normal });
		}
	},

	onUpdate: function onUpdate(id) {
		if (id == this.props.info.id && this.state.mode == GroupTileMode.Waiting) this.setState({ mode: GroupTileMode.Normal });
	},

	onClick: function onClick() {
		page("/groups/" + this.props.info.id);
	},

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.addEventListener("Escape", this.onEscape);

		serverSocket.on("UpdateGroup", this.onUpdate);
		serverSocket.on("UpdateGroupFailed", this.onUpdateFailed);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.removeEventListener("Escape", this.onEscape);

		serverSocket.removeListener("UpdateGroup", this.onUpdate);
		serverSocket.removeListener("UpdateGroupFailed", this.onUpdateFailed);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Context:
				content = React.createElement(
					"div",
					{ className: "box context" },
					React.createElement(
						"li",
						{ onClick: this.onRequestDelete },
						"Delete"
					),
					React.createElement(
						"li",
						{ onClick: this.onRequestRename },
						"Rename"
					)
				);

				break;

			case GroupTileMode.Delete:
				content = React.createElement(
					"div",
					{ className: "box delete-group", onClick: this.onConfirmDelete },
					React.createElement(
						"span",
						null,
						"Are you sure?"
					)
				);

				break;

			case GroupTileMode.Rename:
				content = React.createElement(InputGroupBox, { defaultValue: this.props.info.name, onSubmit: this.onSubmitRename });

				break;

			case GroupTileMode.Waiting:
				content = React.createElement(
					"div",
					{ className: "box group" },
					React.createElement("i", { className: "fa fa-refresh rotate" })
				);

				break;

			default:
				content = React.createElement(
					"div",
					{ className: "box group", onContextMenu: this.onContextMenu, onClick: this.onClick },
					this.props.info.name
				);

				break;
		}

		return React.createElement(
			Tile,
			null,
			content
		);
	}
});

var ParentGroupTile = React.createClass({
	displayName: "ParentGroupTile",

	onClick: function onClick() {
		page("/groups/" + this.props.group);
	},

	render: function render() {
		return React.createElement(
			Tile,
			null,
			React.createElement(
				"div",
				{ className: "box group-action", onClick: this.onClick },
				React.createElement("i", { className: "fa fa-arrow-left" })
			)
		);
	}
});

var GroupContainer = React.createClass({
	displayName: "GroupContainer",

	getInitialState: function getInitialState() {
		return {
			name: null,
			parent: null,
			subGroups: []
		};
	},

	requestSubGroups: function requestSubGroups() {
		serverSocket.emit("GetGroupInfo", this.props.group);
	},

	onGetGroupInfo: function onGetGroupInfo(info) {
		if (info.id != this.props.group) return;

		console.log(info);

		this.setState({
			name: info.name,
			parent: info.parent,
			subGroups: info.subGroups.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			})
		});
	},

	onUpdateGroup: function onUpdateGroup(id) {
		if (id == this.props.group) this.requestSubGroups();
	},

	componentDidMount: function componentDidMount() {
		serverSocket.on("GetGroupInfo", this.onGetGroupInfo);
		serverSocket.on("UpdateGroup", this.onUpdateGroup);

		this.requestSubGroups();
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("GetGroupInfo", this.onGetGroupInfo);
		serverSocket.removeListener("UpdateGroup", this.onUpdateGroup);
	},

	render: function render() {
		var tiles = this.state.subGroups.map(function (group) {
			return React.createElement(GroupTile, { key: "group-tile-" + group.id, info: group });
		});

		var back = this.props.group != null ? React.createElement(ParentGroupTile, { group: this.state.parent }) : null;

		return React.createElement(
			Container,
			null,
			back,
			tiles,
			React.createElement(AddElementTile, { key: "add-group", parent: this.props.group })
		);
	}
});
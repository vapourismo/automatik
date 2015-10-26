"use strict";

var base = require("./base");

var AddGroupBox = React.createClass({
	displayName: "AddGroupBox",

	onSubmit: function onSubmit(name) {
		base.serverSocket.emit("CreateGroup", { name: name, parent: this.props.parent });
		this.props.onSubmit();
	},

	render: function render() {
		return React.createElement(base.InputBox, { onSubmit: this.onSubmit, onCancel: this.props.onCancel });
	}
});

var AddElementTileMode = {
	Normal: 1,
	Context: 2,
	Group: 3,
	Component: 4
};

var AddElementTile = React.createClass({
	displayName: "AddElementTile",

	getInitialState: function getInitialState() {
		return {
			mode: AddElementTileMode.Normal
		};
	},

	onRequestNormal: function onRequestNormal() {
		this.setState({
			mode: AddElementTileMode.Normal
		});
	},

	onOpenContext: function onOpenContext(ev) {
		if (ev.sender != this) this.onRequestNormal();
	},

	onRequestContext: function onRequestContext() {
		window.dispatchEventEasily("OpenContext", {
			sender: this
		});

		this.setState({
			mode: AddElementTileMode.Context
		});
	},

	onRequestGroup: function onRequestGroup() {
		this.setState({
			mode: AddElementTileMode.Group
		});
	},

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenContext", this.onOpenContext);
		window.addEventListener("Escape", this.onRequestNormal);

		this.contextItems = {
			"Group": this.onRequestGroup
		};
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape", this.onRequestNormal);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case AddElementTileMode.Group:
				content = React.createElement(AddGroupBox, { parent: this.props.parent,
					onSubmit: this.onRequestNormal,
					onCancel: this.onRequestNormal });

				break;

			case AddElementTileMode.Context:
				content = React.createElement(base.ContextBox, { items: this.contextItems });

				break;

			default:
				content = React.createElement(
					"div",
					{ className: "box element-action normal", onClick: this.onRequestContext },
					React.createElement("i", { className: "fa fa-plus" })
				);

				break;
		}

		return React.createElement(
			base.Tile,
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

		window.dispatchEventEasily("OpenContext", {
			sender: this
		});
	},

	onRequestDelete: function onRequestDelete() {
		this.setState({ mode: GroupTileMode.Delete });
	},

	onConfirmDelete: function onConfirmDelete() {
		this.setState({ mode: GroupTileMode.Waiting });
		base.serverSocket.emit("DeleteGroup", this.props.info.id);
	},

	onRequestRename: function onRequestRename() {
		this.setState({ mode: GroupTileMode.Rename });
	},

	onSubmitRename: function onSubmitRename(name) {
		this.setState({ mode: GroupTileMode.Waiting });

		base.serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: name
		});
	},

	onOpenContext: function onOpenContext(ev) {
		if (ev.sender != this) this.setState({ mode: GroupTileMode.Normal });
	},

	onEscape: function onEscape() {
		if (this.state.mode > GroupTileMode.Waiting) this.setState({ mode: GroupTileMode.Normal });
	},

	onUpdateFailed: function onUpdateFailed(info) {
		if (info.id == this.props.info.id) {
			window.dispatchEventEasily("DisplayError", {
				message: info.message
			});

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
		window.addEventListener("OpenContext", this.onOpenContext);
		window.addEventListener("Escape", this.onEscape);

		base.serverSocket.on("UpdateGroup", this.onUpdate);
		base.serverSocket.on("UpdateGroupFailed", this.onUpdateFailed);

		this.contextItems = {
			"Delete": this.onRequestDelete,
			"Rename": this.onRequestRename
		};
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape", this.onEscape);

		base.serverSocket.removeListener("UpdateGroup", this.onUpdate);
		base.serverSocket.removeListener("UpdateGroupFailed", this.onUpdateFailed);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Context:
				content = React.createElement(base.ContextBox, { items: this.contextItems });

				break;

			case GroupTileMode.Delete:
				content = React.createElement(base.ConfirmBox, { onConfirm: this.onConfirmDelete });

				break;

			case GroupTileMode.Rename:
				content = React.createElement(base.InputBox, { defaultValue: this.props.info.name, onSubmit: this.onSubmitRename });

				break;

			case GroupTileMode.Waiting:
				content = React.createElement(base.WaitingBox, null);

				break;

			default:
				content = React.createElement(
					"div",
					{ className: "box normal", onContextMenu: this.onContextMenu, onClick: this.onClick },
					this.props.info.name
				);

				break;
		}

		return React.createElement(
			base.Tile,
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
			base.Tile,
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
		base.serverSocket.emit("GetGroupInfo", this.props.group);
	},

	onGetGroupInfo: function onGetGroupInfo(info) {
		if (info.id != this.props.group) return;

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
		base.serverSocket.on("GetGroupInfo", this.onGetGroupInfo);
		base.serverSocket.on("UpdateGroup", this.onUpdateGroup);

		this.requestSubGroups();
	},

	componentWillUnmount: function componentWillUnmount() {
		base.serverSocket.removeListener("GetGroupInfo", this.onGetGroupInfo);
		base.serverSocket.removeListener("UpdateGroup", this.onUpdateGroup);
	},

	render: function render() {
		var tiles = this.state.subGroups.map(function (group) {
			return React.createElement(GroupTile, { key: "group-tile-" + group.id, info: group });
		});

		var back = this.props.group != null ? React.createElement(ParentGroupTile, { group: this.state.parent }) : null;

		return React.createElement(
			base.Container,
			null,
			back,
			tiles,
			React.createElement(AddElementTile, { key: "add-group", parent: this.props.group })
		);
	}
});

module.exports = GroupContainer;
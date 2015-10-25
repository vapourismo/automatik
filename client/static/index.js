"use strict";

var serverSocket = io();

window.dispatchEventEasily = function (tag, attach) {
	var event = new Event(tag);

	if (attach instanceof Object) {
		for (var key in attach) event[key] = attach[key];
	}

	window.dispatchEvent(event);
};

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27) window.dispatchEventEasily("Escape");
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body) window.dispatchEventEasily("Escape");
});

var Tile = React.createClass({
	displayName: "Tile",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "tile" },
			this.props.children
		);
	}
});

var Container = React.createClass({
	displayName: "Container",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "container" },
			this.props.children
		);
	}
});

var InputBox = React.createClass({
	displayName: "InputBox",

	onRequestEditing: function onRequestEditing() {
		this.setState({ editing: true });
	},

	onSubmit: function onSubmit(ev) {
		this.props.onSubmit(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	onCancel: function onCancel(ev) {
		if (this.props.onCancel) this.props.onCancel(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenContext", this.onCancel);
		window.addEventListener("Escape", this.onCancel);

		this.refs.input.select();
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenContext", this.onCancel);
		window.removeEventListener("Escape", this.onCancel);
	},

	render: function render() {
		return React.createElement(
			"form",
			{ className: "box input", onSubmit: this.onSubmit },
			React.createElement("input", { ref: "input", type: "text", defaultValue: this.props.defaultValue, onBlur: this.onCancel })
		);
	},

	componentDidUpdate: function componentDidUpdate() {
		this.refs.input.select();
	}
});

var ContextBox = React.createClass({
	displayName: "ContextBox",

	render: function render() {
		var items = [];

		for (var name in this.props.items) items.push(React.createElement(
			"li",
			{ key: items.length, onClick: this.props.items[name] },
			name
		));

		return React.createElement(
			"div",
			{ className: "box context" },
			items
		);
	}
});

var ConfirmBox = React.createClass({
	displayName: "ConfirmBox",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "box delete", onClick: this.props.onConfirm },
			React.createElement(
				"span",
				null,
				"Are you sure?"
			)
		);
	}
});

var WaitingBox = React.createClass({
	displayName: "WaitingBox",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "box waiting" },
			React.createElement("i", { className: "fa fa-refresh rotate" })
		);
	}
});
"use strict";

var AddGroupBox = React.createClass({
	displayName: "AddGroupBox",

	onSubmit: function onSubmit(name) {
		serverSocket.emit("CreateGroup", { name: name, parent: this.props.parent });
		this.props.onSubmit();
	},

	render: function render() {
		return React.createElement(InputBox, { onSubmit: this.onSubmit, onCancel: this.props.onCancel });
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
				content = React.createElement(ContextBox, { items: this.contextItems });

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

		window.dispatchEventEasily("OpenContext", {
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

	onOpenContext: function onOpenContext(ev) {
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
		window.addEventListener("OpenContext", this.onOpenContext);
		window.addEventListener("Escape", this.onEscape);

		serverSocket.on("UpdateGroup", this.onUpdate);
		serverSocket.on("UpdateGroupFailed", this.onUpdateFailed);

		this.contextItems = {
			"Delete": this.onRequestDelete,
			"Rename": this.onRequestRename
		};
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape", this.onEscape);

		serverSocket.removeListener("UpdateGroup", this.onUpdate);
		serverSocket.removeListener("UpdateGroupFailed", this.onUpdateFailed);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Context:
				content = React.createElement(ContextBox, { items: this.contextItems });

				break;

			case GroupTileMode.Delete:
				content = React.createElement(ConfirmBox, { onConfirm: this.onConfirmDelete });

				break;

			case GroupTileMode.Rename:
				content = React.createElement(InputBox, { defaultValue: this.props.info.name, onSubmit: this.onSubmitRename });

				break;

			case GroupTileMode.Waiting:
				content = React.createElement(WaitingBox, null);

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
"use strict";

var BackendTileMode = {
	Normal: 1,
	Waiting: 2,
	Context: 3,
	Delete: 4,
	Rename: 5
};

var BackendTile = React.createClass({
	displayName: "BackendTile",

	getInitialState: function getInitialState() {
		return {
			mode: BackendTileMode.Normal
		};
	},

	onContextMenu: function onContextMenu(ev) {
		ev.preventDefault();
		this.setState({ mode: BackendTileMode.Context });

		window.dispatchEventEasily("OpenContext", { sender: this });
	},

	onRequestDelete: function onRequestDelete() {
		this.setState({ mode: BackendTileMode.Delete });
	},

	onConfirmDelete: function onConfirmDelete() {
		this.setState({ mode: BackendTileMode.Waiting });
		serverSocket.emit("DeleteBackend", this.props.info.id);
	},

	onRequestRename: function onRequestRename() {
		this.setState({ mode: BackendTileMode.Rename });
	},

	onSubmitRename: function onSubmitRename(name) {
		this.setState({ mode: BackendTileMode.Waiting });

		serverSocket.emit("RenameBackend", {
			id: this.props.info.id,
			name: name
		});
	},

	onOpenContext: function onOpenContext(ev) {
		if (ev.sender != this) this.setState({ mode: BackendTileMode.Normal });
	},

	onEscape: function onEscape() {
		if (this.state.mode > BackendTileMode.Waiting) this.setState({ mode: BackendTileMode.Normal });
	},

	onUpdateFailed: function onUpdateFailed(info) {
		if (info.id == this.props.info.id) {
			displayError(info.message);

			if (this.state.mode == BackendTileMode.Waiting) this.setState({ mode: BackendTileMode.Normal });
		}
	},

	onUpdate: function onUpdate(id) {
		if (id == this.props.info.id && this.state.mode == BackendTileMode.Waiting) this.setState({ mode: BackendTileMode.Normal });
	},

	onClick: function onClick() {
		// page("/backend/" + this.props.info.id);
	},

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenContext", this.onOpenContext);
		window.addEventListener("Escape", this.onEscape);

		serverSocket.on("UpdateBackend", this.onUpdate);
		serverSocket.on("UpdateBackendFailed", this.onUpdateFailed);

		this.contextItems = {
			"Delete": this.onRequestDelete,
			"Rename": this.onRequestRename
		};
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape", this.onEscape);

		serverSocket.removeListener("UpdateBackend", this.onUpdate);
		serverSocket.removeListener("UpdateBackendFailed", this.onUpdateFailed);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case BackendTileMode.Context:
				content = React.createElement(ContextBox, { items: this.contextItems });

				break;

			case BackendTileMode.Delete:
				content = React.createElement(ConfirmBox, { onConfirm: this.onConfirmDelete });

				break;

			case BackendTileMode.Rename:
				content = React.createElement(InputBox, { defaultValue: this.props.info.name, onSubmit: this.onSubmitRename });

				break;

			case BackendTileMode.Waiting:
				content = React.createElement(
					"div",
					{ className: "box backend normal" },
					React.createElement("i", { className: "fa fa-refresh rotate" })
				);

				break;

			default:
				content = React.createElement(
					"div",
					{ className: "box backend normal", onContextMenu: this.onContextMenu, onClick: this.onClick },
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

var BackendContainer = React.createClass({
	displayName: "BackendContainer",

	getInitialState: function getInitialState() {
		return {
			backends: []
		};
	},

	requestBackends: function requestBackends() {
		serverSocket.emit("ListBackends");
	},

	onListBackends: function onListBackends(backends) {
		this.setState({
			backends: backends.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			})
		});
	},

	componentDidMount: function componentDidMount() {
		serverSocket.on("ListBackends", this.onListBackends);

		this.requestBackends();
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("ListBackends", this.onListBackends);
	},

	render: function render() {
		var tiles = this.state.backends.map(function (backend) {
			return React.createElement(BackendTile, { key: "backend-tile-" + backend.id, info: backend });
		});

		return React.createElement(
			Container,
			null,
			tiles
		);
	}
});
"use strict";

var Notification = React.createClass({
	displayName: "Notification",

	render: function render() {
		return React.createElement(
			"div",
			{ className: "notification fade-out" },
			this.props.children
		);
	}
});

var Notifier = React.createClass({
	displayName: "Notifier",

	getInitialState: function getInitialState() {
		return {
			notifications: []
		};
	},

	onDecay: function onDecay() {
		this.setState({
			notifications: this.state.notifications.slice(1)
		});
	},

	onMessage: function onMessage(ev) {
		this.setState({
			notifications: this.state.notifications.concat([React.createElement(
				Notification,
				{ key: this.counter++ },
				ev.message
			)])
		});

		setTimeout(this.onDecay, 15000);
	},

	componentDidMount: function componentDidMount() {
		if (!this.counter) this.counter = 0;

		window.addEventListener("DisplayError", this.onMessage);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("DisplayError", this.onMessage);
	},

	render: function render() {
		return React.createElement(
			"div",
			{ className: "notifier" },
			this.state.notifications
		);
	}
});

function displayError(message) {
	window.dispatchEventEasily("DisplayError", {
		message: message
	});
}

var loadedScripts = {};
serverSocket.on("AttachScript", function (url) {
	if (url in loadedScripts) return;

	var scriptElement = document.createElement("script");
	scriptElement.src = url;

	loadedScripts[url] = scriptElement;
	document.head.appendChild(scriptElement);
});

var loadedStyles = {};
serverSocket.on("AttachStyle", function (url) {
	if (url in loadedStyles) return;

	var linkElement = document.createElement("link");
	linkElement.href = url;
	linkElement.type = "text/css";
	linkElement.rel = "stylesheet";

	loadedStyles[url] = linkElement;
	document.head.appendChild(linkElement);
});

serverSocket.on("DisplayError", displayError);

serverSocket.on("error", function (err) {
	console.error(err);
});

serverSocket.on("disconnect", function () {
	displayError("Lost connection to server");
});

serverSocket.on("reconnect", function () {
	displayError("Successfully reconnected");
});

function displayGroup(group) {
	ReactDOM.render(React.createElement(
		"div",
		null,
		React.createElement(GroupContainer, { key: "group-container-" + group, group: group }),
		React.createElement(Notifier, null)
	), document.getElementById("canvas"));
}

function displayBackends() {
	ReactDOM.render(React.createElement(
		"div",
		null,
		React.createElement(BackendContainer, { key: "backend-container" }),
		React.createElement(Notifier, null)
	), document.getElementById("canvas"));
}

page(/^\/groups\/(\d+)/, function (ctx) {
	return displayGroup(Number.parseInt(ctx.params[0]));
});

page("/backends", displayBackends);

page("/", function () {
	displayGroup(null);
});

page(function () {
	page.redirect("/");
});

window.addEventListener("load", function () {
	page({
		click: false
	});
});
"use strict";

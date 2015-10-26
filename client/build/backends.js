"use strict";

var base = require("./base");

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
		base.serverSocket.emit("DeleteBackend", this.props.info.id);
	},

	onRequestRename: function onRequestRename() {
		this.setState({ mode: BackendTileMode.Rename });
	},

	onSubmitRename: function onSubmitRename(name) {
		this.setState({ mode: BackendTileMode.Waiting });

		base.serverSocket.emit("RenameBackend", {
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
			window.dispatchEventEasily("DisplayError", {
				message: info.message
			});

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

		base.serverSocket.on("UpdateBackend", this.onUpdate);
		base.serverSocket.on("UpdateBackendFailed", this.onUpdateFailed);

		this.contextItems = {
			"Delete": this.onRequestDelete,
			"Rename": this.onRequestRename
		};
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape", this.onEscape);

		base.serverSocket.removeListener("UpdateBackend", this.onUpdate);
		base.serverSocket.removeListener("UpdateBackendFailed", this.onUpdateFailed);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case BackendTileMode.Context:
				content = React.createElement(base.ContextBox, { items: this.contextItems });

				break;

			case BackendTileMode.Delete:
				content = React.createElement(base.ConfirmBox, { onConfirm: this.onConfirmDelete });

				break;

			case BackendTileMode.Rename:
				content = React.createElement(base.InputBox, { defaultValue: this.props.info.name, onSubmit: this.onSubmitRename });

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
			base.Tile,
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
		base.serverSocket.emit("ListBackends");
	},

	onListBackends: function onListBackends(backends) {
		this.setState({
			backends: backends.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			})
		});
	},

	componentDidMount: function componentDidMount() {
		base.serverSocket.on("ListBackends", this.onListBackends);

		this.requestBackends();
	},

	componentWillUnmount: function componentWillUnmount() {
		base.serverSocket.removeListener("ListBackends", this.onListBackends);
	},

	render: function render() {
		var tiles = this.state.backends.map(function (backend) {
			return React.createElement("bBackendTile", { key: "backend-tile-" + backend.id, info: backend });
		});

		return React.createElement(
			base.Container,
			null,
			tiles
		);
	}
});

module.exports = BackendContainer;
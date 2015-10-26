const React = require("react");
const base  = require("./base.jsx");

const BackendTileMode = {
	Normal:  1,
	Waiting: 2,
	Context: 3,
	Delete:  4,
	Rename:  5
};

const BackendTile = React.createClass({
	getInitialState: function () {
		return {
			mode: BackendTileMode.Normal
		};
	},

	onContextMenu: function (ev) {
		ev.preventDefault();
		this.setState({mode: BackendTileMode.Context});

		window.dispatchEventEasily("OpenContext", {sender: this});
	},

	onRequestDelete: function () {
		this.setState({mode: BackendTileMode.Delete});
	},

	onConfirmDelete: function () {
		this.setState({mode: BackendTileMode.Waiting});
		base.serverSocket.emit("DeleteBackend", this.props.info.id);
	},

	onRequestRename: function () {
		this.setState({mode: BackendTileMode.Rename});
	},

	onSubmitRename: function (name) {
		this.setState({mode: BackendTileMode.Waiting});

		base.serverSocket.emit("RenameBackend", {
			id: this.props.info.id,
			name: name
		});
	},

	onOpenContext: function (ev) {
		if (ev.sender != this) this.setState({mode: BackendTileMode.Normal});
	},

	onEscape: function () {
		if (this.state.mode > BackendTileMode.Waiting)
			this.setState({mode: BackendTileMode.Normal});
	},

	onUpdateFailed: function (info) {
		if (info.id == this.props.info.id) {
			window.dispatchEventEasily("DisplayError", {
				message: info.message
			});

			if (this.state.mode == BackendTileMode.Waiting)
				this.setState({mode: BackendTileMode.Normal});
		}
	},

	onUpdate: function (id) {
		if (id == this.props.info.id && this.state.mode == BackendTileMode.Waiting)
			this.setState({mode: BackendTileMode.Normal});
	},

	onClick: function () {
		// page("/backend/" + this.props.info.id);
	},

	componentDidMount: function () {
		window.addEventListener("OpenContext", this.onOpenContext);
		window.addEventListener("Escape",      this.onEscape);

		base.serverSocket.on("UpdateBackend",       this.onUpdate);
		base.serverSocket.on("UpdateBackendFailed", this.onUpdateFailed);

		this.contextItems = {
			"Delete": this.onRequestDelete,
			"Rename": this.onRequestRename
		};
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenContext", this.onOpenContext);
		window.removeEventListener("Escape",      this.onEscape);

		base.serverSocket.removeListener("UpdateBackend",       this.onUpdate);
		base.serverSocket.removeListener("UpdateBackendFailed", this.onUpdateFailed);
	},

	render: function () {
		var content;

		switch (this.state.mode) {
			case BackendTileMode.Context:
				content = <base.ContextBox items={this.contextItems}/>;

				break;

			case BackendTileMode.Delete:
				content = <base.ConfirmBox onConfirm={this.onConfirmDelete}/>;

				break;

			case BackendTileMode.Rename:
				content = (
		           <base.InputBox defaultValue={this.props.info.name} onSubmit={this.onSubmitRename}/>
				);

				break;

			case BackendTileMode.Waiting:
				content = (
					<div className="box backend normal">
						<i className="fa fa-refresh rotate"></i>
					</div>
				);

				break;

			default:
				content = (
					<div className="box backend normal" onContextMenu={this.onContextMenu} onClick={this.onClick}>
						{this.props.info.name}
					</div>
				);

				break;
		}

		return <base.Tile>{content}</base.Tile>;
	}
});

const BackendContainer = React.createClass({
	getInitialState: function () {
		return {
			backends: []
		};
	},

	requestBackends: function () {
		base.serverSocket.emit("ListBackends");
	},

	onListBackends: function (backends) {
		this.setState({
			backends: backends.sort((a, b) => a.name.localeCompare(b.name))
		});
	},

	componentDidMount: function () {
		base.serverSocket.on("ListBackends", this.onListBackends);

		this.requestBackends();
	},

	componentWillUnmount: function () {
		base.serverSocket.removeListener("ListBackends", this.onListBackends);
	},

	render: function () {
		const tiles = this.state.backends.map(
			backend => <bBackendTile key={"backend-tile-" + backend.id} info={backend}/>
		);

		return (
			<base.Container>
				{tiles}
			</base.Container>
		);
	}
});

module.exports = BackendContainer;

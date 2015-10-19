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

var AddGroupTile = React.createClass({
	displayName: "AddGroupTile",

	getInitialState: function getInitialState() {
		return {
			editing: false
		};
	},

	onRequestEditing: function onRequestEditing() {
		this.setState({ editing: true });
	},

	onSubmit: function onSubmit(name) {
		serverSocket.emit("CreateGroup", { name: name, parent: this.props.group });
		this.setState({ editing: false });
	},

	onCancel: function onCancel() {
		this.setState({ editing: false });
	},

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenGroupContext", this.onCancel);
		window.addEventListener("Escape", this.onCancel);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenGroupContext", this.onCancel);
		window.removeEventListener("Escape", this.onCancel);
	},

	render: function render() {
		if (this.state.editing) {
			return React.createElement(
				Tile,
				null,
				React.createElement(InputGroupBox, { onSubmit: this.onSubmit, onCancel: this.onCancel })
			);
		} else {
			return React.createElement(
				Tile,
				null,
				React.createElement(
					"a",
					{ className: "box add-group", onClick: this.onRequestEditing },
					React.createElement("i", { className: "fa fa-plus" })
				)
			);
		}
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

		var ctxEvent = new Event("OpenGroupContext");
		ctxEvent.sender = this;

		window.dispatchEvent(ctxEvent);
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

	componentDidMount: function componentDidMount() {
		window.addEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.addEventListener("Escape", this.onEscape);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenGroupContext", this.onOpenGroupContext);
		window.removeEventListener("Escape", this.onEscape);
	},

	render: function render() {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Normal:
				content = React.createElement(
					"a",
					{ className: "box group", onContextMenu: this.onContextMenu },
					this.props.info.name
				);

				break;

			case GroupTileMode.Context:
				content = React.createElement(
					"div",
					{ className: "box context" },
					React.createElement(
						"li",
						{ onClick: this.onRequestDelete, className: "first" },
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
					"a",
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
		}

		return React.createElement(
			Tile,
			null,
			content
		);
	}
});

var GroupContainer = React.createClass({
	displayName: "GroupContainer",

	getInitialState: function getInitialState() {
		return { groups: [], showTempTile: false };
	},

	requestSubGroups: function requestSubGroups() {
		serverSocket.emit("ListSubGroups", this.props.group);
	},

	onListSubGroups: function onListSubGroups(info) {
		if (info.group != this.props.group) return;

		this.setState({
			groups: info.subGroups.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			})
		});
	},

	onUpdateGroup: function onUpdateGroup(group) {
		if (group == this.props.group) this.requestSubGroups();
	},

	componentDidMount: function componentDidMount() {
		serverSocket.on("ListSubGroups", this.onListSubGroups);
		serverSocket.on("UpdateGroup", this.onUpdateGroup);

		this.counter = 0;
		this.requestSubGroups();
	},

	componentWillUnmount: function componentWillUnmount() {
		serverSocket.removeListener("ListSubGroups", this.onListSubGroups);
		serverSocket.removeListener("UpdateGroup", this.onUpdateGroup);
	},

	render: function render() {
		var tiles = this.state.groups.map((function (group) {
			return React.createElement(GroupTile, { key: this.counter++, info: group });
		}).bind(this));

		tiles.push(React.createElement(AddGroupTile, { key: "add-group", group: this.props.group }));

		return React.createElement(
			Container,
			null,
			tiles
		);
	}
});
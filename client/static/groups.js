"use strict";

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

	focusRenameInput: function focusRenameInput() {
		this.refs.name.select();
	},

	onSubmitRename: function onSubmitRename(ev) {
		this.setState({ mode: GroupTileMode.Waiting });
		serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: this.refs.name.value
		});

		if (ev) ev.preventDefault();
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
				content = React.createElement(
					"form",
					{ className: "box add-group", onClick: this.focusRenameInput, onSubmit: this.onSubmitRename },
					React.createElement("input", { className: "name", ref: "name", type: "text", defaultValue: this.props.info.name, onBlur: this.onSubmitRename })
				);

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
	},

	componentDidUpdate: function componentDidUpdate() {
		if (this.state.mode == GroupTileMode.Rename) this.focusRenameInput();
	}
});

var EditableGroupTile = React.createClass({
	displayName: "EditableGroupTile",

	onKey: function onKey(ev) {
		if (ev.keyCode == 27) this.props.onCancel();else if (ev.keyCode == 13) this.props.onSubmit(this.refs.name.value);
	},

	componentDidMount: function componentDidMount() {
		this.refs.name.focus();
	},

	render: function render() {
		return React.createElement(
			Tile,
			null,
			React.createElement(
				"div",
				{ className: "box add-group" },
				React.createElement("input", { className: "name", ref: "name", type: "text", onKeyUp: this.onKey, onBlur: this.props.onCancel })
			)
		);
	}
});
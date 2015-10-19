"use strict";

var GroupTileMode = {
	Normal: 1,
	Context: 2,
	Delete: 3,
	Rename: 4
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
		serverSocket.emit("DeleteGroup", this.props.info.id);
		this.setState({ mode: GroupTileMode.Normal });
	},

	onRequestRename: function onRequestRename() {
		this.setState({ mode: GroupTileMode.Rename });
	},

	focusRenameInput: function focusRenameInput() {
		this.refs.name.select();
	},

	onSubmitRename: function onSubmitRename(ev) {
		serverSocket.emit("RenameGroup", {
			id: this.props.info.id,
			name: this.refs.name.value
		});

		this.setState({ mode: GroupTileMode.Normal });
		if (ev) ev.preventDefault();
	},

	componentDidMount: function componentDidMount() {
		this.eventHandlers = {
			openGroupContext: (function (ev) {
				if (ev.sender != this) this.setState({ mode: GroupTileMode.Normal });
			}).bind(this),

			escape: (function () {
				this.setState({ mode: GroupTileMode.Normal });
			}).bind(this)
		};

		window.addEventListener("OpenGroupContext", this.eventHandlers.openGroupContext);
		window.addEventListener("Escape", this.eventHandlers.escape);
	},

	componentWillUnmount: function componentWillUnmount() {
		window.removeEventListener("OpenGroupContext", this.eventHandlers.openGroupContext);
		window.removeEventListener("Escape", this.eventHandlers.escape);
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
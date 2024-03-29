const page        = require("page");
const React       = require("react");

const Events      = require("./events.jsx");
const Notifier    = require("./notifier.jsx");
const Namespace   = require("./namespace.jsx");
const ReactCommon = require("./react-common.jsx");
const Component   = require("./components.jsx");

const AddElementTileMode = {
	Normal:    1,
	Context:   2,
	Group:     3,
	Component: 4
};

const AddElementTile = React.createClass({
	getInitialState() {
		return {mode: AddElementTileMode.Normal};
	},

	restoreNormal() {
		this.setState({mode: AddElementTileMode.Normal});
	},

	anotherContextMenuOpened(ev) {
		if (ev.sender != this) this.restoreNormal();
	},

	displayContextMenu() {
		Events.emit("OpenContext", {sender: this});
		this.setState({mode: AddElementTileMode.Context});
	},

	requestAddGroup() {
		this.setState({mode: AddElementTileMode.Group});
	},

	createGroup(name) {
		Namespace.with("group/" + this.props.parent).invoke("create", name).then(
			this.restoreNormal,
			error => Notifier.displayError(error.message)
		);
	},

	componentDidMount() {
		Events.on("OpenContext", this.anotherContextMenuOpened);
		Events.on("Escape",      this.restoreNormal);

		this.contextItems = {
			"Group": this.requestAddGroup
		};
	},

	componentWillUnmount() {
		Events.off("OpenContext", this.anotherContextMenuOpened);
		Events.off("Escape",      this.restoreNormal);
	},

	render() {
		var content;

		switch (this.state.mode) {
			case AddElementTileMode.Group:
				content = (
					<ReactCommon.InputBox onSubmit={this.createGroup}
					                      onCancel={this.restoreNormal}/>
				);

				break;

			case AddElementTileMode.Context:
				content = <ReactCommon.ContextBox items={this.contextItems}/>;

				break;

			default:
				content = <ReactCommon.PlusBox onClick={this.displayContextMenu}/>

				break;
		}

		return <ReactCommon.Tile>{content}</ReactCommon.Tile>
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
	getInitialState() {
		return {mode: GroupTileMode.Normal};
	},

	restoreNormal() {
		this.setState({mode: GroupTileMode.Normal});
	},

	displayContextMenu(ev) {
		this.setState({mode: GroupTileMode.Context});
		Events.emit("OpenContext", {sender: this});

		if (ev) ev.preventDefault();
		return false;
	},

	requestDelete() {
		this.setState({mode: GroupTileMode.Delete});
	},

	performDelete() {
		this.setState({mode: GroupTileMode.Waiting});

		this.channel.invoke("delete").then(
			this.requestNormal,
			error => {
				Notifier.displayError(error.message);
				this.requestNormal();
			}
		);
	},

	requestRename() {
		this.setState({mode: GroupTileMode.Rename});
	},

	performRename(name) {
		this.setState({mode: GroupTileMode.Waiting});

		this.channel.invoke("rename", name).then(
			this.restoreNormal,
			error => {
				Notifier.displayError(error.message);
				this.requestRename();
			}
		);
	},

	anotherContextMenuOpened(ev) {
		if (ev.sender != this) this.setState({mode: GroupTileMode.Normal});
	},

	cancelInteraction() {
		if (this.state.mode > GroupTileMode.Waiting)
			this.restoreNormal();
	},

	openGroup() {
		page("/groups/" + this.props.info.id);
	},

	componentDidMount() {
		Events.on("OpenContext", this.anotherContextMenuOpened);
		Events.on("Escape",      this.cancelInteraction);

		this.channel = Namespace.subscribe("group/" + this.props.info.id);

		this.contextItems = {
			"Delete": this.requestDelete,
			"Rename": this.requestRename
		};
	},

	componentWillUnmount() {
		Events.off("OpenContext", this.anotherContextMenuOpened);
		Events.off("Escape",      this.cancelInteraction);

		this.channel.unsubscribe();
	},

	render() {
		var content;

		switch (this.state.mode) {
			case GroupTileMode.Context:
				content = <ReactCommon.ContextBox items={this.contextItems}/>;

				break;

			case GroupTileMode.Delete:
				content = <ReactCommon.ConfirmBox onConfirm={this.performDelete}/>;

				break;

			case GroupTileMode.Rename:
				content = (
		           <ReactCommon.InputBox defaultValue={this.props.info.name}
		                                 onSubmit={this.performRename}
		                                 onCancel={this.restoreNormal}/>
				);

				break;

			case GroupTileMode.Waiting:
				content = <ReactCommon.WaitingBox />;

				break;

			default:
				content = (
					<div className="box normal" onContextMenu={this.displayContextMenu}
					                            onClick={this.openGroup}>
						{this.props.info.name}
					</div>
				);

				break;
		}

		return <ReactCommon.Tile>{content}</ReactCommon.Tile>;
	}
});

const ParentGroupTile = React.createClass({
	onClick() {
		page("/groups/" + this.props.group);
	},

	render() {
		return (
			<ReactCommon.Tile>
				<div className="box back" onClick={this.onClick}>
					<i className="fa fa-arrow-left"></i>
				</div>
			</ReactCommon.Tile>
		);
	}
});

const GroupContainer = React.createClass({
	getInitialState() {
		return {
			name: null,
			parent: null,
			subGroups: [],
			components: []
		};
	},

	requestInfo() {
		this.channel.invoke("describe").then(
			info => {
				this.setState({
					name:       info.name,
					parent:     info.parent,
					subGroups:  info.subGroups.sort((a, b) => a.name.localeCompare(b.name)),
					components: info.components.sort((a, b) => a.name.localeCompare(b.name))
				});
			},
			error => {
				if (typeof(this.state.parent) == "number")
					page("/groups/" + this.state.parent);
				else
					page("/");
			}
		);
	},

	deleteGroup(origin) {
		if (typeof(this.state.name) == "string")
			Notifier.displayError("Group '" + this.state.name + "' has been removed");

		if (typeof(origin) == "number")
			page("/groups/" + origin);
		else
			page("/");
	},

	componentDidMount() {
		this.channel = Namespace.subscribe("group/" + this.props.group);
		this.channel.on("refresh", this.requestInfo);
		this.channel.on("delete", this.deleteGroup);

		this.requestInfo();
	},

	componentWillUnmount() {
		this.channel.off("refresh", this.requestInfo);
		this.channel.off("delete", this.deleteGroup);
		this.channel.unsubscribe();
	},

	render() {
		const groups = this.state.subGroups.map(
			group => <GroupTile key={"g" + group.id} info={group}/>
		);

		const components = this.state.components.map(
			com => <Component key={"c" + com.id} info={com}/>
		);

		const back = this.props.group != null ? <ParentGroupTile group={this.state.parent}/> : null;

		return (
			<ReactCommon.Container>
				{back}
				{groups}
				{components}
				<AddElementTile parent={this.props.group}/>
			</ReactCommon.Container>
		);
	}
});

module.exports = GroupContainer;

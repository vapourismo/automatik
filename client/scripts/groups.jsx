import page        from "page";
import React       from "react";

import Network     from "./network.jsx";
import Notifier    from "./notifier.jsx";
import Events      from "./events.jsx";
import ReactCommon from "./react-common.jsx"

const AddGroupBox = React.createClass({
	onSubmit(name) {
		Network.emit("CreateGroup", {name: name, parent: this.props.parent});
		this.props.onSubmit();
	},

	render() {
		return <ReactCommon.InputBox onSubmit={this.onSubmit} onCancel={this.props.onCancel}/>
	}
});

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

	onRequestNormal() {
		this.setState({mode: AddElementTileMode.Normal});
	},

	onOpenContext(ev) {
		if (ev.sender != this) this.onRequestNormal();
	},

	onRequestContext() {
		Events.emit("OpenContext", {sender: this});
		this.setState({mode: AddElementTileMode.Context});
	},

	onRequestGroup() {
		this.setState({mode: AddElementTileMode.Group});
	},

	componentDidMount() {
		Events.on("OpenContext", this.onOpenContext);
		Events.on("Escape",      this.onRequestNormal);

		this.contextItems = {
			"Group": this.onRequestGroup
		};
	},

	componentWillUnmount() {
		Events.off("OpenContext", this.onOpenContext);
		Events.off("Escape",      this.onRequestNormal);
	},

	render() {
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
				content = <ReactCommon.ContextBox items={this.contextItems}/>;

				break;

			default:
				content = <ReactCommon.PlusBox onClick={this.onRequestContext}/>

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
		Network.emit("DeleteGroup", this.props.info.id);
	},

	requestRename() {
		this.setState({mode: GroupTileMode.Rename});
	},

	performRename(name) {
		this.setState({mode: GroupTileMode.Waiting});

		Network.emit("RenameGroup", {
			id: this.props.info.id,
			name: name
		});
	},

	anotherContextMenuOpened(ev) {
		if (ev.sender != this) this.setState({mode: GroupTileMode.Normal});
	},

	cancelInteraction() {
		if (this.state.mode > GroupTileMode.Waiting)
			this.restoreNormal();
	},

	updateSucceeded(id) {
		if (id == this.props.info.id && this.state.mode == GroupTileMode.Waiting)
			this.restoreNormal();
	},

	updateFailed(info) {
		if (info.id == this.props.info.id) {
			Notifier.displayError(info.message);

			if (this.state.mode == GroupTileMode.Waiting)
				this.restoreNormal();
		}
	},

	openGroup() {
		page("/groups/" + this.props.info.id);
	},

	componentDidMount() {
		Events.on("OpenContext", this.anotherContextMenuOpened);
		Events.on("Escape",      this.cancelInteraction);

		Network.on("UpdateGroup",       this.updateSucceeded);
		Network.on("UpdateGroupFailed", this.updateFailed);

		this.contextItems = {
			"Delete": this.requestDelete,
			"Rename": this.requestRename
		};
	},

	componentWillUnmount() {
		Events.off("OpenContext", this.anotherContextMenuOpened);
		Events.off("Escape",      this.cancelInteraction);

		Network.off("UpdateGroup",       this.updateSucceeded);
		Network.off("UpdateGroupFailed", this.updateFailed);
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
			subGroups: []
		};
	},

	requestSubGroups() {
		Network.emit("GetGroupInfo", this.props.group);
	},

	onGetGroupInfo(info) {
		if (info.id != this.props.group)
			return;

		this.setState({
			name: info.name,
			parent: info.parent,
			subGroups: info.subGroups.sort((a, b) => a.name.localeCompare(b.name))
		});
	},

	onUpdateGroup(id) {
		if (id == this.props.group)
			this.requestSubGroups();
	},

	componentDidMount() {
		Network.on("GetGroupInfo", this.onGetGroupInfo);
		Network.on("UpdateGroup",  this.onUpdateGroup);

		this.requestSubGroups();
	},

	componentWillUnmount() {
		Network.off("GetGroupInfo", this.onGetGroupInfo);
		Network.off("UpdateGroup",  this.onUpdateGroup);
	},

	render() {
		const tiles = this.state.subGroups.map(
			group => <GroupTile key={"group-tile-" + group.id} info={group}/>
		);

		const back = this.props.group != null ? <ParentGroupTile group={this.state.parent}/> : null;

		return (
			<ReactCommon.Container>
				{back}
				{tiles}
				<AddElementTile key="add-group" parent={this.props.group}/>
			</ReactCommon.Container>
		);
	}
});

module.exports = GroupContainer;

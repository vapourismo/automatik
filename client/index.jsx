var GroupContainer = React.createClass({
	getInitialState: function () {
		return {groups: [], showTempTile: false};
	},

	requestGroups: function () {
		serverSocket.emit("ListGroups");
	},

	onSubmitAddGroup: function (name) {
		serverSocket.emit("AddGroup", name);
		this.setState({showTempTile: false});
	},

	onCancelAddGroup: function (name) {
		this.setState({showTempTile: false});
	},

	onClickAddGroup: function () {
		this.setState({showTempTile: true});
	},

	componentDidMount: function () {
		this.eventHandlers = {
			listGroups: function (groups) {
				this.setState({
					groups: groups.sort(function (a, b) {
						return a.name.localeCompare(b.name);
					})
				});
			}.bind(this),

			updateGroups: this.requestGroups
		};

		serverSocket.on("ListGroups",   this.eventHandlers.listGroups);
		serverSocket.on("UpdateGroups", this.eventHandlers.updateGroups);

		this.requestGroups();
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("ListGroups",   this.eventHandlers.listGroups);
		serverSocket.removeListener("UpdateGroups", this.eventHandlers.updateGroups);
	},

	render: function () {
		var tiles = this.state.groups.map(function (group) {
			return <GroupTile key={group.id} info={group}/>;
		});

		if (this.state.showTempTile) {
			tiles.push(
				<EditableGroupTile key="edit-group" onSubmit={this.onSubmitAddGroup} onCancel={this.onCancelAddGroup}/>
			);
		} else {
			tiles.push(
				<Tile key="add-group">
					<a className="add-tile" onClick={this.onClickAddGroup}>
						<i className="fa fa-plus"></i>
					</a>
				</Tile>
			);
		}

		return <Container>{tiles}</Container>;
	}
});

var Notification = React.createClass({
	render: function () {
		return (
			<div className="notification fade-out">
				{this.props.children}
			</div>
		);
	}
});

var Notifier = React.createClass({
	getInitialState: function () {
		return {
			notifications: []
		};
	},

	onDecay: function () {
		this.setState({
			notifications: this.state.notifications.slice(1)
		});
	},

	componentDidMount: function () {
		var counter = 0;

		serverSocket.on("DisplayError", function (err) {
			this.setState({
				notifications: this.state.notifications.concat([
					<Notification key={counter++}>{err}</Notification>
				])
			});

			setTimeout(this.onDecay, 15000);
		}.bind(this));
	},

	render: function () {
		return <div className="notifier">{this.state.notifications}</div>;
	}
});

window.addEventListener("load", function () {
	ReactDOM.render(
		<div>
			<GroupContainer />
			<Notifier />
		</div>,
		document.body
	);
});

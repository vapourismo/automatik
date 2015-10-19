var GroupContainer = React.createClass({
	getInitialState: function () {
		return {groups: [], showTempTile: false};
	},

	requestSubGroups: function () {
		serverSocket.emit("ListSubGroups", this.props.group);
	},

	onListSubGroups: function (info) {
		if (info.group != this.props.group)
			return;

		this.setState({
			groups: info.subGroups.sort(function (a, b) {
				return a.name.localeCompare(b.name);
			})
		});
	},

	onUpdateGroup: function (group) {
		if (group == this.props.group)
			this.requestSubGroups();
	},

	componentDidMount: function () {
		serverSocket.on("ListSubGroups", this.onListSubGroups);
		serverSocket.on("UpdateGroup",   this.onUpdateGroup);

		this.counter = 0;
		this.requestSubGroups();
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("ListSubGroups", this.onListSubGroups);
		serverSocket.removeListener("UpdateGroup",   this.onUpdateGroup);
	},

	render: function () {
		var tiles = this.state.groups.map(function (group) {
			return <GroupTile key={this.counter++} info={group}/>;
		}.bind(this));

		tiles.push(<AddGroupTile key="add-group" group={this.props.group}/>);

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
			<GroupContainer group={null}/>
			<Notifier />
		</div>,
		document.getElementById("canvas")
	);
});

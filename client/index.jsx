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

	onMessage: function (err) {
		this.setState({
			notifications: this.state.notifications.concat([
				<Notification key={this.counter++}>{err}</Notification>
			])
		});

		setTimeout(this.onDecay, 15000);
	},

	componentDidMount: function () {
		if (!this.counter) this.counter = 0;
		serverSocket.on("DisplayError", this.onMessage);
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("DisplayError", this.onMessage);
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

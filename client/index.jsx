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

	onMessage: function (message) {
		this.setState({
			notifications: this.state.notifications.concat([
				<Notification key={this.counter++}>{message}</Notification>
			])
		});

		setTimeout(this.onDecay, 15000);
	},

	onLocalMessage: function (ev) {
		this.onMessage(ev.message);
	},

	componentDidMount: function () {
		if (!this.counter) this.counter = 0;

		serverSocket.on("DisplayError", this.onMessage);
		window.addEventListener("DisplayError", this.onLocalMessage);
	},

	componentWillUnmount: function () {
		serverSocket.removeListener("DisplayError", this.onMessage);
		window.removeEventListener("DisplayError", this.onLocalMessage);
	},

	render: function () {
		return <div className="notifier">{this.state.notifications}</div>;
	}
});

function displayError(message) {
	window.dispatchEventEasily("DisplayError", {
		message: message
	});
}

window.addEventListener("load", function () {
	ReactDOM.render(
		<div>
			<GroupContainer group={null}/>
			<Notifier />
		</div>,
		document.getElementById("canvas")
	);
});

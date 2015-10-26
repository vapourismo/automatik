const GroupContainer   = require("./groups");
const BackendContainer = require("./backends");
const base             = require("./base");

const Notification = React.createClass({
	render: function () {
		return (
			<div className="notification fade-out">
				{this.props.children}
			</div>
		);
	}
});

const Notifier = React.createClass({
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

	onMessage: function (ev) {
		this.setState({
			notifications: this.state.notifications.concat([
				<Notification key={this.counter++}>{ev.message}</Notification>
			])
		});

		setTimeout(this.onDecay, 15000);
	},

	componentDidMount: function () {
		if (!this.counter) this.counter = 0;

		window.addEventListener("DisplayError", this.onMessage);
	},

	componentWillUnmount: function () {
		window.removeEventListener("DisplayError", this.onMessage);
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

base.serverSocket.on("DisplayError", displayError);

base.serverSocket.on("error", function (err) {
	console.error(err);
});

base.serverSocket.on("disconnect", function () {
	displayError("Lost connection to server");
});

base.serverSocket.on("reconnect", function () {
	displayError("Successfully reconnected");
});

function displayGroup(group) {
	ReactDOM.render(
		<div>
			<GroupContainer key={"group-container-" + group} group={group}/>
			<Notifier />
		</div>,
		document.getElementById("canvas")
	);
}

function displayBackends() {
	ReactDOM.render(
		<div>
			<BackendContainer key="backend-container" />
			<Notifier />
		</div>,
		document.getElementById("canvas")
	);
}

page(/^\/groups\/(\d+)/, ctx => displayGroup(Number.parseInt(ctx.params[0])));

page("/backends", displayBackends);

page("/", function () {
	displayGroup(null);
});

page(function () {
	page.redirect("/");
});

window.addEventListener("load", function () {
	page({
		click: false
	});
});

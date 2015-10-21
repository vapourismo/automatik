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

serverSocket.on("DisplayError", displayError);

function displayGroup(group) {
	ReactDOM.render(
		<div>
			<GroupContainer key={"group-container-" + group} group={group}/>
			<Notifier />
		</div>,
		document.getElementById("canvas")
	);
}

page(/^\/groups\/(\d+)/, function (ctx) {
	displayGroup(Number.parseInt(ctx.params[0]));
});

page("/", function () {
	displayGroup(null);
});

page(function () {
	console.log("none");
	page.redirect("/");
});

window.addEventListener("load", function () {
	page(window.location.pathname);
});

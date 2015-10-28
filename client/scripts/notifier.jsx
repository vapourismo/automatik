const React = require("react");
const $ = require("jquery");
require("jquery-ui");

const Notification = React.createClass({
	componentDidMount() {
		this.startTimer();
	},

	hide() {
		$(this.refs.pane).animate({opacity: 0}, 400, () => {
			this.marked = true;
			$(this.refs.pane).slideUp(400, this.props.onDecay);
		});
	},

	stopTimer() {
		if (!this.marked)
			$(this.refs.pane).stop(true).animate({opacity: 1});

		clearTimeout(this.timeout);
	},

	startTimer() {
		this.timeout = setTimeout(this.hide, 5000);
	},

	render() {
		return (
			<div ref="pane"
			     className={this.props.isError ? "notification error" : "notification info"}
			     onMouseEnter={this.stopTimer}
			     onMouseLeave={this.startTimer}
			     onClick={this.hide}>
				{this.props.children}
			</div>
		);
	}
});

var self = undefined;

const Notifier = React.createClass({
	statics: {
		displayError(contents) {
			if (self) self.appendNotification(true, contents);
		},

		displayInfo(contents) {
			if (self) self.appendNotification(false, contents);
		}
	},

	getInitialState() {
		return {
			notifications: []
		};
	},

	removeItem(key) {
		this.setState({
			notifications: this.state.notifications.filter(item => item.key != key)
		});
	},

	appendNotification(error, contents) {
		const key = this.counter++;

		let item = (
			<Notification key={key} isError={error} onDecay={() => this.removeItem(key)}>
				{contents}
			</Notification>
		);

		this.setState({
			notifications: this.state.notifications.concat([item])
		});
	},

	componentDidMount() {
		self = this;
		this.counter = 0;
	},

	componentWillUnmount() {
		if (self === this) self = undefined;
	},

	render() {
		return <div className="notifier">{this.state.notifications}</div>;
	}
});

module.exports = Notifier;

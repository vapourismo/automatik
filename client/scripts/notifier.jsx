import React from "react";

const Notification = React.createClass({
	render() {
		return (
			<div className="notification fade-out">
				{this.props.children}
			</div>
		);
	}
});

var self = undefined;

const Notifier = React.createClass({
	statics: {
		displayError(contents) {
			if (!self) return;

			self.appendNotification(contents);
		},

		displayInfo(contents) {
			this.displayError(contents);
		}
	},

	getInitialState() {
		return {
			notifications: []
		};
	},

	appendNotification(contents) {
		this.setState({
			notifications: this.state.notifications.concat([
				<Notification key={this.counter++}>
					{contents}
				</Notification>
			])
		});

		setTimeout(() => {
			this.setState({notifications: this.state.notifications.slice(1)});
		}, 15000);
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

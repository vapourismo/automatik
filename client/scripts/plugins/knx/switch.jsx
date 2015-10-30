const React       = require("react");
const Notifier    = require("../../notifier.jsx");
const ReactCommon = require("../../react-common.jsx");

const Switch = React.createClass({
	getInitialState() {
		return {
			value: false
		};
	},

	requestCurrentValue() {
		this.props.channel.invoke("getCurrentValue").then(
			this.updateValue,
			error => Notifier.displayError(error.message)
		);
	},

	updateValue(value) {
		this.setState({value: !!value});
	},

	componentDidMount() {
		this.props.channel.subscribe();
		this.props.channel.on("update", this.updateValue);

		this.requestCurrentValue();
	},

	componentWillUnmount() {
		this.props.channel.unsubscribe();
		this.props.channel.off("update", this.updateValue);
	},

	render() {
		return null;
	}
});

module.exports = Switch;

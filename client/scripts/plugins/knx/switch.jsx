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

	toggle() {
		this.props.channel.trigger("switch", !this.state.value);
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
		let stateElem;

		if (this.state.value)
			stateElem = <i className="fa fa-circle"></i>;
		else
			stateElem = <i className="fa fa-circle-o"></i>;

		return (
			<div className="box knx-switch" onClick={this.toggle}>
				<div className="name">{this.props.name}</div>
				<div className="value">{stateElem}</div>
			</div>
		);
	}
});

module.exports = Switch;

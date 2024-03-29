const React         = require("react");
const Notifier      = require("./notifier.jsx");
const Namespace     = require("./namespace.jsx");
const ReactCommon   = require("./react-common.jsx");
const DefaultPlugin = require("./plugins/default.jsx");

const types = {
	Switch: DefaultPlugin.Switch
};

const ComponentTile = React.createClass({
	loadType() {
		if (this.props.info.type in types)
			return types[this.props.info.type];
		else
			return null;
	},

	componentWillMount() {
		this.channel = Namespace.subscribe("component/" + this.props.info.id);
	},

	componentWillUnmount() {
		this.channel.unsubscribe();
	},

	render() {
		const Type = this.loadType();

		if (!Type) {
			console.error("Type '" + this.props.info.type + "' has not been loaded");
			return null;
		}

		return (
			<ReactCommon.Tile>
				<Type name={this.props.info.name} channel={this.channel}/>
			</ReactCommon.Tile>
		);
	}
});

module.exports = ComponentTile;

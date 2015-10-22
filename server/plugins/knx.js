const knxclient = require("knxclient");

module.exports = function () {
	this.registerDriver("knx_router", {
		configure: function (config) {
			this.client = new knxclient.RouterClient(config);
			this.datapoints = {};
		}
	});
};

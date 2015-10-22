const knxclient = require("knxclient");
const drivers   = require("../drivers");

drivers.register("knx_router", {
	configure: function (config) {
		this.client = new knxclient.RouterClient(config);
		this.datapoints = {};
	}
});

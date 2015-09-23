var knxclient = require("knxclient");

const DefaultPrototype = {
	read: function () {
		return this.value;
	},

	write: function (value) {
		var payload = this.__pack__(value);
		if (payload) {
			this.router.send(0, this.address, payload);
		}

		this.value = value;
	},

	update: function (msg) {
		this.value = this.__unpack__(msg);
	},

	__unpack__: function (msg) {},
	__pack__: function (value) {}
};

const BoolPrototype = {
	__proto__: DefaultPrototype,
	__unpack__: function (msg) { return msg.asBool(); },
	__pack__: function (value) { return knxclient.makeBool(value); }
};

const Float16Prototype = {
	__proto__: DefaultPrototype,
	__unpack__: function (msg) { return msg.asFloat16(); },
	__pack__: function (value) { return knxclient.makeFloat16(value); }
};

function KNXRouter(conf) {
	this.client = new knxclient.RouterClient(conf);
	this.datapoints = {};

	this.client.listen(function (sender, msg) {
		var dps = this.datapoints[msg.destination];
		if (dps) {
			dps.forEach(function (dp) {
				dp.update(msg);
			});
		}
	}.bind(this));
}

function makeDatapoint(router, conf) {
	switch (conf.type) {
		case 1:
			return {router: router, address: conf.address, __proto__: BoolPrototype};

		case 9:
			return {router: router, address: conf.address, __proto__: Float16Prototype};

		default:
			return null;
	}
}

KNXRouter.prototype = {
	configure: function (conf) {
		if (conf && typeof(conf.address) == "number" && typeof(conf.type) == "number") {
			var dp = makeDatapoint(this, conf);

			if (!dp)
				return;

			if (conf.address in this.datapoints) {
				this.datapoints[conf.address].push(dp);
			} else {
				this.datapoints[conf.address] = [dp];
			}

			return dp;
		}
	}
};

module.exports = KNXRouter;

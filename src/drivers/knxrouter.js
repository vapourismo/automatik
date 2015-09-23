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
		this.notify();
	},

	listen: function (callback) {
		this.hooks.push(callback);
	},

	mute: function (callback) {
		var idx = this.hooks.indexOf(callback);
		if (idx >= 0)
			delete this.hooks[idx];
	},

	update: function (msg) {
		this.value = this.__unpack__(msg);
		this.notify();
	},

	notify: function () {
		this.hooks.forEach(function (callback) {
			callback(this, this.value);
		}.bind(this));
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
	var dp = {
		router: router,
		address: conf.address,
		value: null,
		hooks: []
	};

	switch (conf.type) {
		case 1:
			dp.__proto__ = BoolPrototype;
			break;

		case 9:
			dp.__proto__ = Float16Prototype;
			break;

		default:
			return null;
	}

	return dp;
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

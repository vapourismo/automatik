var knxclient = require("knxclient");

const DefaultPrototype = {
	read: function () {
		return this.value;
	},

	write: function (value) {
		var payload = this.__pack__(value);
		if (payload != null) {
			this.router.send(0, this.address, payload);
			this.value = value;
			this.notify();
		}
	},

	empty: function () {
		return value == null;
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
		var newValue = this.__unpack__(msg);
		if (newValue != null) {
			this.value = newValue;
			this.notify();
		}
	},

	notify: function () {
		this.hooks.forEach(function (callback) {
			callback.call(this, this.value);
		}.bind(this));
	},

	__unpack__: function (msg) {},
	__pack__: function (value) {}
};

function makeDatapointClass(type, unpack, pack) {
	var ctor = function (router, address, value) {
		this.hooks = [];
		this.router = router;
		this.address = address;

		if (typeof(value) == type)
			this.value = value;
	};

	ctor.prototype = {
		__proto__: DefaultPrototype,
		__unpack__: unpack,
		__pack__: pack
	};

	return ctor;
}

var Bool = makeDatapointClass(
	"boolean",
	msg => msg.asBool(),
	value => knxclient.makeBool(value)
);

var Float16 = makeDatapointClass(
	"number",
	msg => msg.asFloat16(),
	value => knxclient.makeFloat16(value)
);

function Router(conf) {
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

function newDatapoint(router, conf, value) {
	switch (conf.type) {
		case 1:
			return new Bool(router, conf.address, value);

		case 9:
			return new Float16(router, conf.address, value);

		default:
			return null;
	}
}

Router.prototype = {
	configureDatapoint: function (conf, value) {
		if (conf && typeof(conf.address) == "number" && typeof(conf.type) == "number") {
			var dp = newDatapoint(this, conf, value);

			if (!dp) return;

			if (conf.address in this.datapoints) {
				this.datapoints[conf.address].push(dp);
			} else {
				this.datapoints[conf.address] = [dp];
			}

			return dp;
		}
	}
};

Router.meta = {
	name: "KNX Router",
	description: "Provides access to datapoints via KNX router"
};

module.exports = {
	"knx_router": Router
};

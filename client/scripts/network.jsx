require("es6-promise").polyfill();

const Notifier = require("./notifier.jsx");

const network = io();

// Socket events
network.on("disconnect", () => Notifier.displayError("Lost connection to server"));
network.on("reconnect", () => Notifier.displayInfo("Successfully reconnected"));

const channels = {};

function subscribe(channel) {
	if (channel in channels) {
		if (++channels[channel] == 1)
			network.emit("subscribe", channel);
	} else {
		channels[channel] = 1;
		network.emit("subscribe", channel);
	}
}

function unsubscribe(channel) {
	if (!(channel in channels))
		return;

	if (--channels[channel] == 0)
		network.emit("unsubscribe", channel);
}

function on(channel, event, callback) {
	subscribe(channel);
	network.on("event:" + channel + ":" + event, callback);
}

function off(channel, event, callback) {
	network.off("event:" + channel + ":" + event, callback);
	unsubscribe(channel);
}

let sinkCounter = 0;
const sinkTimeout = 10000;

function invoke(name, ...args) {
	name = "invoke:" + name;

	return new Promise(function (accept, reject) {
		const sink = sinkCounter++;

		let timeout;

		const callee = function (retsink, error, ...retargs) {
			if (retsink != sink)
				return;

			clearTimeout(timeout);
			network.off(name, callee);

			if (error == null)
				accept(...retargs);
			else
				reject(error);
		};

		network.on(name, callee);
		network.emit(name, sink, ...args);

		timeout = setTimeout(function () {
			network.off(name, callee);
			reject(new Error("Invocation for '" + name + "' timed out"));
		}, sinkTimeout);
	});
}

function bindNetworkFunction(name) {
	return function (...args) {
		return invoke(name, ...args);
	};
}

module.exports = {
	getGroupInfo: bindNetworkFunction("getGroupInfo"),
	createGroup:  bindNetworkFunction("createGroup"),
	deleteGroup:  bindNetworkFunction("deleteGroup"),
	renameGroup:  bindNetworkFunction("renameGroup"),

	onGroupEvent(gid, event, callback) {
		on("group/" + gid, event, callback);
	},

	offGroupEvent(gid, event, callback) {
		off("group/" + gid, event, callback);
	}
};

require("es6-promise").polyfill();

const Notifier = require("./notifier.jsx");

const network = io();

// Socket events
network.on("disconnect", () => Notifier.displayError("Lost connection to server"));
network.on("reconnect", () => Notifier.displayInfo("Successfully reconnected"));

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

function on(name, callback) {
	network.on("event:" + name, callback);
}

function off(name, callback) {
	network.off("event:" + name, callback);
}

module.exports = {
	getGroupInfo: bindNetworkFunction("getGroupInfo"),
	createGroup:  bindNetworkFunction("createGroup"),
	deleteGroup:  bindNetworkFunction("deleteGroup"),
	renameGroup:  bindNetworkFunction("renameGroup"),
	on:           on,
	off:          off
};

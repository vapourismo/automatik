require("es6-promise").polyfill();

const Notifier = require("./notifier.jsx");

const network = io();

// Socket events
network.on("disconnect", () => Notifier.displayError("Lost connection to server"));
network.on("reconnect", () => Notifier.displayInfo("Successfully reconnected"));

// Protocol events
network.on("DisplayError", Notifier.displayError);

let sinkCounter = 0;

network.invoke = function (name, ...args) {
	return new Promise(function (accept, reject) {
		const sink = sinkCounter++;

		const callee = function (retsink, error, ...retargs) {
			if (retsink != sink)
				return;

			network.off(name, callee);

			if (error == null)
				accept(...retargs);
			else
				reject(error);
		};

		network.on(name, callee);
		network.emit(name, sink, ...args);
	});
};

const networkFunctions = [
	"getGroupInfo",
	"createGroup",
	"deleteGroup",
	"renameGroup"
];

networkFunctions.forEach(function (name) {
	network[name] = function (...args) { return network.invoke(name, ...args); };
});

module.exports = network;

const Notifier = require("./notifier.jsx");

const network = io();

// Socket events
network.on("disconnect", () => Notifier.displayError("Lost connection to server"));
network.on("reconnect", () => Notifier.displayInfo("Successfully reconnected"));

// Protocol events
network.on("DisplayError", Notifier.displayError);

module.exports = network;

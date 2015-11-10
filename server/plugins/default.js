"use strict";

const components = require("../components");

class Switch extends components.Type {
	constructor(channel, config, slots) {
		super();
		Object.assign(this, slots);

		this.channel = channel;
		this.config = config;

		this.channel.register("getCurrentValue", (reply, reject) => reply(this.status.read()));
		this.channel.on("switch", value => this.control.write(!!value));

		this.status.listen(value => this.channel.trigger("update", value));
	}
}

components.registerType(Switch);

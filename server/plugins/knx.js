module.exports = function () {
	this.registerDriver("knx_router", {
		configure: function (config) {
			console.log(config);
		}
	});
};

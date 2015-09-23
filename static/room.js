var sockio = io();

$(document).ready(function () {
	var x = document.getElementsByClassName("component");
	var ids = [];

	for (var i = 0; i < x.length; i++) {
		var comID = x[i].getAttribute("data-id");
		if (comID) ids.push(comID);
	}

	sockio.emit("request-component-updates", ids);

	sockio.on("update-component", function (msg) {
		$(".component[data-id=" + msg.id + "] .value").each(function (idx, elem) {
			elem.innerText = msg.value;
		});
	});
});

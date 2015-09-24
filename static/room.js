var sockio = io();

sockio.on("update-entity", function (msg) {
	$(".entity[data-id=" + msg.id + "] .value").each(function (idx, elem) {
		elem.innerText = msg.value;
	});
});

function showPopup(title, contents) {
	$("#overlay .popup .header .title")[0].innerHTML = title;
	$("#overlay .popup .contents")[0].innerHTML = contents;
	$("#overlay").css({visibility: "visible"}).animate({opacity: 1});
}

function hidePopup() {
	$("#overlay").animate(
		{opacity: 0},
		function () {
			$(this).css({visibility: "hidden"})
		}
	);
}

var sockio = io();

sockio.on("update-entity", function (msg) {
	$(".entity[data-id=" + msg.id + "] .value").each(function (idx, elem) {
		elem.innerText = msg.value;
	});
});

sockio.on("show-popup", function (msg) {
	showPopup(msg.title, msg.contents);
});

$(document).ready(function () {
	$(".entity").each(function (idx, elem) {
		var id = elem.getAttribute("data-id");
		if (!id)
			return;

		$(elem).click(function () {
			sockio.emit("click-entity", id);
		});
	});

	$(".popup .header .close").click(function () {
		hidePopup();
	});
});

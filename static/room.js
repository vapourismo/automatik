function showPopup(contents) {
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

sockio.on("display-popup", showPopup);

$(document).ready(function () {
	$(".entity").each(function (idx, elem) {
		var entityID = elem.getAttribute("data-id");
		if (!entityID)
			return;

		$(elem).click(function () {
			var contents = $(".entity[data-id=" + entityID + "] .label")[0].innerText;
			showPopup(new Date().toString() + ": " + contents);
		});
	});

	$(".popup .header .close").click(function () {
		hidePopup();
	});
});

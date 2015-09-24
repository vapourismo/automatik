document.popup = {
	show: function(title, contents, script) {
		$("#overlay .popup .header .title")[0].innerText = title;

		var elem = $("#overlay .popup .contents")[0]
		elem.innerHTML = contents;

		if (script) {
			var scriptElem = document.createElement("script");
			scriptElem.src = script;
			elem.appendChild(scriptElem);
		}

		$("#overlay").css({visibility: "visible"}).animate({opacity: 1});
	},

	hide: function () {
		$("#overlay").animate(
			{opacity: 0},
			function () {
				$(this).css({visibility: "hidden"})
			}
		);
	}
};

var sockio = io();

sockio.on("UpdateEntity", function (msg) {
	$(".entity[data-id=" + msg.id + "] .value").each(function (idx, elem) {
		elem.innerText = msg.value;
	});
});

sockio.on("ShowPopup", function (msg) {
	document.popup.show(msg.title, msg.contents, msg.script);
});

$(document).ready(function () {
	$(".entity").each(function (idx, elem) {
		var id = elem.getAttribute("data-id");
		if (!id)
			return;

		$(elem).click(function () {
			sockio.emit("ClickEntity", id);
		});
	});

	$(".popup .header .close").click(function () {
		document.popup.hide();
	});
});

document.comm = {
	informEntity: function (id, msg) {
		sockio.emit("InformEntity", {id: id, msg: msg});
	}
};

var insertedStyleSheets = {};

document.insertStyleSheet = function (href) {
	if (href in insertedStyleSheets)
		return;

	var elem = document.createElement("link");
	elem.rel = "stylesheet";
	elem.type = "text/css";
	elem.href = href;

	$("head")[0].appendChild(elem);
	insertedStyleSheets[href] = elem;
};

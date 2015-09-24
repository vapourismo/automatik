document.insertStyleSheet("/static/classes/temperature.css");

$("#temperature-picker .picker .higher").click(function () {
	$("#temperature-picker .picker .value").each(function (idx, elem) {
		var id = elem.getAttribute("data-id");
		var value = elem.getAttribute("data-value");
		var metric = elem.getAttribute("data-metric");

		var rest = value % 1;

		if (rest < 0.5)
			value = (value - rest) + 0.5;
		else
			value = (value - rest) + 1;

		elem.setAttribute("data-value",  value);
		elem.innerText = value + metric;

		document.comm.informEntity(id, value);
	});
});

$("#temperature-picker .picker .lower").click(function () {
	$("#temperature-picker .picker .value").each(function (idx, elem) {
		var id = elem.getAttribute("data-id");
		var value = elem.getAttribute("data-value");
		var metric = elem.getAttribute("data-metric");

		var rest = value % 1;

		if (rest > 0.5)
			value = (value - rest) + 0.5;
		else if (rest == 0)
			value -= 0.5;
		else
			value -= rest;

		elem.setAttribute("data-value",  value);
		elem.innerText = value + metric;

		document.comm.informEntity(id, value);
	});
});

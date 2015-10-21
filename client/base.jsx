var serverSocket = io();

window.dispatchEventEasily = function (tag, attach) {
	var event = new Event(tag);

	if (attach instanceof Object) {
		for (var key in attach)
			event[key] = attach[key];
	}

	window.dispatchEvent(event);
};

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27)
		window.dispatchEventEasily("Escape");
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body)
		window.dispatchEventEasily("Escape");
});

var Tile = React.createClass({
	render: function () {
		return <div className="tile">{this.props.children}</div>;
	}
});

var Container = React.createClass({
	render: function () {
		return <div className="container">{this.props.children}</div>;
	}
});

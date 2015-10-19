var serverSocket = io();

window.addEventListener("keyup", function (ev) {
	if (ev.keyCode == 27)
		window.dispatchEvent(new Event("Escape"));
});

window.addEventListener("click", function (ev) {
	if (ev.target == document.body)
		window.dispatchEvent(new Event("Escape"));
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

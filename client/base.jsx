const serverSocket = io();

window.dispatchEventEasily = function (tag, attach) {
	const event = new Event(tag);

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

const Tile = React.createClass({
	render: function () {
		return <div className="tile">{this.props.children}</div>;
	}
});

const Container = React.createClass({
	render: function () {
		return <div className="container">{this.props.children}</div>;
	}
});

const InputBox = React.createClass({
	onRequestEditing: function () {
		this.setState({editing: true});
	},

	onSubmit: function (ev) {
		this.props.onSubmit(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	onCancel: function (ev) {
		if (this.props.onCancel)
			this.props.onCancel(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	componentDidMount: function () {
		window.addEventListener("OpenContext", this.onCancel);
		window.addEventListener("Escape",      this.onCancel);

		this.refs.input.select();
	},

	componentWillUnmount: function () {
		window.removeEventListener("OpenContext", this.onCancel);
		window.removeEventListener("Escape",      this.onCancel);
	},

	render: function () {
		return (
			<form className="box input" onSubmit={this.onSubmit}>
				<input ref="input" type="text" defaultValue={this.props.defaultValue} onBlur={this.onCancel}/>
			</form>
		);
	},

	componentDidUpdate: function () {
		this.refs.input.select();
	}
});

const ContextBox = React.createClass({
	render: function () {
		const items = [];

		for (var name in this.props.items)
			items.push(<li key={items.length} onClick={this.props.items[name]}>{name}</li>);

		return <div className="box context">{items}</div>;
	}
});

const ConfirmBox = React.createClass({
	render: function () {
		return (
			<div className="box delete" onClick={this.props.onConfirm}>
				<span>Are you sure?</span>
			</div>
		);
	}
});

const WaitingBox = React.createClass({
	render: function () {
		return (
			<div className="box waiting">
				<i className="fa fa-refresh rotate"></i>
			</div>
		);
	}
});

module.exports = {
	Tile:         Tile,
	Container:    Container,
	InputBox:     InputBox,
	ContextBox:   ContextBox,
	ConfirmBox:   ConfirmBox,
	WaitingBox:   WaitingBox,

	serverSocket: serverSocket
};

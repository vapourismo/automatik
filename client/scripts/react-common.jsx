const React  = require("react");
const Events = require("./events.jsx");

const Tile = React.createClass({
	componentDidMount() {
		this.refs.tile.style.height = this.refs.tile.offsetWidth;
	},

	render() {
		return <div ref="tile" className="tile">{this.props.children}</div>;
	}
});

window.addEventListener("resize", function () {
	const tiles = document.querySelectorAll(".tile");

	for (let i = 0; i < tiles.length; i++)
		tiles[i].style.height = tiles[i].offsetWidth;
});

const Container = React.createClass({
	render() {
		return <div className="container">{this.props.children}</div>;
	}
});

const InputBox = React.createClass({
	submitInput(ev) {
		this.props.onSubmit(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	cancelInput(ev) {
		if (this.props.onCancel)
			this.props.onCancel(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	componentDidMount() {
		this.refs.input.select();
	},

	componentDidUpdate() {
		this.refs.input.select();
	},

	render() {
		return (
			<form className="box input" onSubmit={this.submitInput}>
				<input ref="input" type="text" defaultValue={this.props.defaultValue} onBlur={this.cancelInput}/>
			</form>
		);
	}
});

const PlusBox = React.createClass({
	render() {
		return (
			<div className="box plus" onClick={this.props.onClick}>
				<i className="fa fa-plus"></i>
			</div>
		);
	}
});

const ContextBox = React.createClass({
	render() {
		const items = [];

		for (var name in this.props.items)
			items.push(<li key={items.length} onClick={this.props.items[name]}>{name}</li>);

		return <div className="box context">{items}</div>;
	}
});

const ConfirmBox = React.createClass({
	render() {
		return (
			<div className="box confirm" onClick={this.props.onConfirm}>
				<span>Are you sure?</span>
			</div>
		);
	}
});

const WaitingBox = React.createClass({
	render() {
		return (
			<div className="box normal">
				<i className="fa fa-refresh rotate"></i>
			</div>
		);
	}
});

module.exports = {
	Tile:         Tile,
	Container:    Container,
	InputBox:     InputBox,
	PlusBox:      PlusBox,
	ContextBox:   ContextBox,
	ConfirmBox:   ConfirmBox,
	WaitingBox:   WaitingBox
};

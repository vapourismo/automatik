import React  from "react";
import Events from "./events.jsx";

const Tile = React.createClass({
	adjustHeight() {
		this.refs.tile.style.height = this.refs.tile.offsetWidth;
	},

	componentDidMount() {
		window.addEventListener("resize", this.adjustHeight);
		this.adjustHeight();
	},

	componentWillUnmount() {
		window.removeEventListener("resize", this.adjustHeight);
	},

	render() {
		return <div ref="tile" className="tile">{this.props.children}</div>;
	}
});

const Container = React.createClass({
	render() {
		return <div className="container">{this.props.children}</div>;
	}
});

const InputBox = React.createClass({
	onSubmit(ev) {
		this.props.onSubmit(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	onCancel(ev) {
		if (this.props.onCancel)
			this.props.onCancel(this.refs.input.value);

		if (ev) ev.preventDefault();
		return false;
	},

	componentDidMount() {
		Events.on("OpenContext", this.onCancel);
		Events.on("Escape",      this.onCancel);

		this.refs.input.select();
	},

	componentWillUnmount() {
		Events.off("OpenContext", this.onCancel);
		Events.off("Escape",      this.onCancel);
	},

	render() {
		return (
			<form className="box input" onSubmit={this.onSubmit}>
				<input ref="input" type="text" defaultValue={this.props.defaultValue} onBlur={this.onCancel}/>
			</form>
		);
	},

	componentDidUpdate() {
		this.refs.input.select();
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

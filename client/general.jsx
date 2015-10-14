var Tile = React.createClass({
	render: function () {
		return (
			<div className="tile">
				{this.props.children}
			</div>
		);
	}
});

var Container = React.createClass({
	render: function () {
		return <div className="container">{this.props.children}</div>;
	}
});

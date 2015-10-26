module.exports = {
	entry: "./scripts/index.jsx",
	output: {
		filename: "./static/index.js"
	},
	module: {
		loaders: [
			{
				test: /\.jsx$/,
				exclude: /node_modules/,
				loader: "babel"
			}
		]
	}
};

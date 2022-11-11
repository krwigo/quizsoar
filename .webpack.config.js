const path = require("path");
module.exports = {
	mode: "production",
	entry: path.resolve(__dirname, "src.js"),
	output: {
		path: path.resolve(__dirname, "docs"),
		filename: "main.js",
		clean: true,
	},
	module: {
		rules: [
			{
				//
				test: /\.js$/,
				loader: "esbuild-loader",
				options: {
					loader: "jsx",
					target: "es2015",
				},
			},
			{
				//
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	devServer: {
		allowedHosts: "all",
	},
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000,
	},
};

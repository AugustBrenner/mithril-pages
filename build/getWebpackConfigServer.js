const path = require('path')
const nodeExternals = require('webpack-node-externals')
const StringReplacePlugin = require("string-replace-webpack-plugin")

module.exports = function(pathname, dirname, production){
	
	return {
		mode: production ? 'production' : 'development',
		entry: pathname,
		output: {
			path: pathname,
	        filename: 'bundle_server.js',
	        library: 'app',
	        libraryTarget: 'umd'
	    },
	    target: 'node',
   		externals: [nodeExternals()],
	    node: {
			fs: 'empty',
			net: 'empty',
			tls: 'empty',
			'crypto': 'empty'
		},
		resolve: {
			alias: {
				'mithril-pages': path.resolve(__dirname, '../server/index.js')
			}
		},
		module: {
			rules: [
		        {
					test: /\.js$/,
						exclude: /(node_modules|bower_components)/,
						use: {
							loader: 'babel-loader',
							options: {
							presets: ['@babel/preset-env']
						}
					}
				}
			]
		},
	    devtool: 'sourcemap',
	}

}


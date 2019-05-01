const path = require('path')
const webpack = require('webpack')
const StringReplacePlugin = require("string-replace-webpack-plugin")

module.exports = function(pathname, dirname, production){
	
	return {
		mode: production ? 'production' : 'development',
		entry: [
			'webpack-hot-middleware/client',
			path.resolve(__dirname, './bundle-bridge-client.js'),
		],
		output: {
			path: dirname,
	        filename: 'bundle_client.js',
	        library: 'app',
	        libraryTarget: 'umd'
	    },
	    resolve: {
			alias: {
				'mithril-pages': path.resolve(__dirname, '../client/index.js')
			}
		},
		module: {
			rules: [
		        { 
		            include: [
          				path.resolve(__dirname, 'bundle-bridge-client.js')
          			],
		            loader: StringReplacePlugin.replace({
		                replacements: [
		                    {
		                        pattern: /PLACEHOLDER_FOR_ENTRY/g,
		                        replacement: function (match, p1, offset, string) {
		                            return pathname
		                        }
		                    }
		                ]
		            })
		        },
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
	   	plugins: [
	   		new StringReplacePlugin(),
    		new webpack.HotModuleReplacementPlugin(),
		],
	   	devtool: production ? false : 'inline-source-map',
	}
}


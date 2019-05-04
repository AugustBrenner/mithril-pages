const path = require('path')
const webpack = require('webpack')
const StringReplacePlugin = require('string-replace-webpack-plugin')
const crypto = require('crypto')

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
					loader: 'string-replace-loader',
					options: {
						search: 'PLACEHOLDER_FOR_ENTRY',
						replace: pathname,
					}
		        },
		        {
					test: /\.js$/,
					exclude: /(node_modules|bower_components|client|mithril)/,
					use: [
						{
							loader: path.resolve(__dirname, './functionReplaceLoader.js'),
							options:{
								match: 'm.lazy.require',
								replacement: function(match, args, rootContext, resourcePath){

									var path_hash = resourcePath.replace(rootContext, '') + match

									var md5sum = crypto.createHash('md5')
									md5sum.update(path_hash)
									path_hash = md5sum.digest('hex')

									return  `m.lazy.require(function(){return import(${args[0]})}, ${args[1]}, ${args[2]}, '${path_hash}')`
								}
							}
						},
						{
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
								plugins: ["@babel/plugin-syntax-dynamic-import"]
							}
						}
					]
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


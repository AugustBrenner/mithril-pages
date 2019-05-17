const path = require('path')
const crypto = require('crypto')
const webpack = require('webpack')
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')


module.exports = function(pathname, dirname, production){

	var common = {
		entry: pathname,
		output: {
			path: pathname,
	        filename: 'bundle_server.js',
	        library: 'app',
	        libraryTarget: 'umd'
	    },
	    target: 'node',
   		externals: [nodeExternals({whitelist:['mithril-pages']})],
	    node: {
			fs: 'empty',
			net: 'empty',
			tls: 'empty',
			'crypto': 'empty'
		},
		resolve: {
			alias: {
				'mithril-pages': path.resolve(__dirname, '../server/index.js')
			},
		},
		resolveLoader: {
		    modules: [path.resolve(__dirname, '../node_modules')],
		},
		module: {
			rules: [
		        {
					test: /\.js$/,
					exclude: /(node_modules|bower_components)/,
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

									return  `m.lazy.require(require(${args[0]}), '${path_hash}')`
								}
							}
						},
						{

							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
							}
						},
					]
				},
			]
		},
		plugins: [],
	}











	var dev = {
		mode: 'development',
		devtool: 'inline-source-map',
		module: {
			rules: [
				{
					test: /\.(sa|sc|c)ss$/,
					exclude: /(node_modules|bower_components|client|mithril)/,
					use: [
						{
							loader: 'css-loader',
							options: {
								importLoaders: 1,
								sourceMap: true,
								modules: true,
								localIdentName: '[local]-[hash:base64:5]',
							}
						},
						{
							loader: 'resolve-url-loader',
							options: {
								sourceMap: true,
							}
						},
    					{
    						loader: 'sass-loader',
    						options: {
    							sourceMap: true
    						}
    					},
					]
				},
			]
		},
	}









	var prod = {
		mode: 'production',
		module: {
			rules: [
				{
					test: /\.(sa|sc|c)ss$/,
					exclude: /(node_modules|bower_components|client|mithril)/,
					use: [
						{
							loader: 'css-loader',
							options: {
								importLoaders: 1,
								sourceMap: false,
								modules: true,
								localIdentName: '[hash:base64:5]',
							}
						},
						{
							loader: 'resolve-url-loader',
							options: {
								sourceMap: true,
								engine: 'postcss',	
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								sourceMap: true,
								plugins: [
									require('postcss-preset-env')(),
									require('cssnano')()
								]
							},
						},
    					{
    						loader: 'sass-loader',
    						options: {
    							sourceMap: true
    						}
    					},
					]
				},
			]
		},
		optimization: {
			namedModules: true,
			namedChunks: true
		},
		devtool: 'source-map',
	}





	return merge(common, production ? prod : dev)
}


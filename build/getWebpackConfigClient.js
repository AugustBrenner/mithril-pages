const path = require('path')
const crypto = require('crypto')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

module.exports = function(pathname, production){

	var common = {
		entry: [
			path.resolve(__dirname, './bundle-bridge-client.js'),
		],
		context: path.dirname(pathname),
		output: {
			path: '/',
	        library: 'app',
	        libraryTarget: 'umd'
	    },
	    resolve: {
			alias: {
				'mithril-pages': path.resolve(__dirname, '../client/index.js')
			}
		},
		resolveLoader: {
		    modules: [path.resolve(__dirname, '../node_modules')],
		},
		module: {
			rules: [
				{
					test: /\.(png|jpe?g|gif|woff(2)?|ttf|eot|svg)$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								emitFile: false,
								name: '[name].[ext]',
								outputPath: (url, resourcePath, context) => {

									return resourcePath
								},
							},
						},
					],
				},
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

									var require_path = path.resolve(path.dirname(resourcePath), args[0].replace(/\'|\`|\"/g, ''))

									require_path = require_path.replace(rootContext, '.')

									var resource_path = resourcePath.replace(rootContext, '')

									var md5sum = crypto.createHash('md5')
									md5sum.update(resource_path + match)
									var path_hash = md5sum.digest('hex')

									return  `m.lazy.require(function(){return import(/* webpackChunkName: "${path_hash}" */ ${args[0]})}, ${args[1]}, '${path_hash}', '${require_path}')`
								}
							}
						},
					]
				}
			]
		},
		plugins: [
			new FriendlyErrorsWebpackPlugin({
				compilationSuccessInfo: {
					messages: ['You application is running here http://localhost:3000'],
					notes: ['Some additional notes to be displayed upon successful compilation']
				},
				// onErrors: function (severity, errors) {},
				clearConsole: true,
				// additionalFormatters: [],
				// additionalTransformers: []
			})
		],
	}











	var dev = {
		mode: 'development',
		entry: [
			'webpack-hot-middleware/client',
		],
		output: {
	        filename: 'bundle.js',
	    },
	    module: {
			rules: [
		        {
					test: /\.js$/,
					exclude: /(node_modules|bower_components|client|mithril)/,
					use: [
						{
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
								plugins: ["@babel/plugin-syntax-dynamic-import"]
							}
						}
					]
				},
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
		plugins: [
    		new webpack.HotModuleReplacementPlugin(),
    		new HardSourceWebpackPlugin({
				cacheDirectory: path.resolve(process.cwd(), './.cache/client/'),
				environmentHash: {
				    root: process.cwd(),
				    directories: [],
				    files: ['package-lock.json', 'yarn.lock'],
				},
			}),
		],
		devtool: 'inline-source-map',
	}









	var prod = {
		mode: 'production',
		output: {
	        filename: '[contenthash].[name].bundle.js',
	    },
	    module: {
			rules: [
		        {
					test: /\.js$/,
					exclude: /(node_modules|bower_components|client|mithril)/,
					use: [
						{
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
							}
						}
					]
				},
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
	    devtool: 'hidden-source-map',
	}










	return merge(common, production ? prod : dev)
}


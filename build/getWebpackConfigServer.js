const path = require('path')
const crypto = require('crypto')
const webpack = require('webpack')
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')


module.exports = function(pathname, production, environment_variables){

	var common = {
		entry: pathname,
		context: path.dirname(pathname),
		output: {
			path: '/',
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
		    modules: [path.resolve(__dirname, '../..'), path.resolve(__dirname, '../node_modules')],
		},
		module: {
			rules: [
				{
					test: /\.(woff(2)?|ttf|eot|svg|ico)$/,
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
					test: /\.(png|jpe?g|gif|tif?f)$/,
					use: [
						{
							loader: path.resolve(__dirname, './imageLoader.js'),
							options: {
								emitFile: false,
							}
						},
					],
				},
				{ 
		            include: [
          				path.resolve(__dirname, '../server/index.js')
          			],
					loader: 'string-replace-loader',
					options: {
						search: 'PLACEHOLDER_FOR_ENVIRONMENT_VARIABLES',
						replace: JSON.stringify(environment_variables || {}),
					}
		        },
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

									return  `m.lazy.require(require(${args[0]}), ${args[1]}, '${path_hash}')`
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
		plugins: [
			// new FriendlyErrorsWebpackPlugin({
			// 	compilationSuccessInfo: {
			// 		messages: ['Application Server successfully running'],
			// 		// notes: ['Some additional notes to be displayed upon successful compilation']
			// 	},
			// 	// onErrors: function (severity, errors) {},
			// 	clearConsole: true,
			// 	// additionalFormatters: [],
			// 	// additionalTransformers: []
			// })
		],
	}











	var dev = {
		mode: 'development',
		devtool: 'source-map',
		module: {
			rules: [
				{
					test: /\.(sa|sc|c)ss$/,
					exclude: [/node_modules/, /bower_components/, path.resolve(__dirname, '../client'), path.resolve(__dirname, '../mithril')],
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
			new HardSourceWebpackPlugin({
				cacheDirectory: path.resolve(process.cwd(), './.cache/server/'),
				environmentHash: {
				    root: process.cwd(),
				    directories: [],
				    files: ['package-lock.json', 'yarn.lock'],
				},
			})
		],
	}









	var prod = {
		mode: 'production',
		module: {
			rules: [
				{
					test: /\.(sa|sc|c)ss$/,
					exclude: [/node_modules/, /bower_components/, path.resolve(__dirname, '../client'), path.resolve(__dirname, '../mithril')],
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


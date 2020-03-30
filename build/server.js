"use strict"

const path 						= require('path')
const url 						= require("url")
const webpack 					= require('webpack')
const MemoryFileSystem 			= require('memory-fs')
const requireFromString 		= require('require-from-string')
const SourceMapSupport 			= require('source-map-support')

const webpackDevMiddleware 		= require('webpack-dev-middleware')
const webapckHotMiddleware 		= require("webpack-hot-middleware")

const getWebpackConfigClient 	= require('./getWebpackConfigClient.js')
const getWebpackConfigServer 	= require('./getWebpackConfigServer.js')

const render  					= require('./render')


const fileSystem 				= new MemoryFileSystem()




// This function makes server rendering of asset references consistent with different webpack chunk/entry configurations
function normalizeAssets(assets) {
  if (isObject(assets)) {
    return Object.values(assets);
  }

  return Array.isArray(assets) ? assets : [assets];
}

function isObject(obj){
	return typeof obj === 'object'
}





	// const listeners = []
	// this.on = listener => {
	// 	listeners.push(listener)

	// 	return function(){
	// 		for(var i = listeners.length; i > 0; --i){
	// 			if(listeners[i] == listeners) listeners.splice(i, 1)
	// 		}
	// 	}
	// }

	// var publish = function(app){
	// 	for(var i = 0; i < listeners.length; i++){
	// 		if(listeners[i] == listeners) listeners.splice(i, 1)
	// 	}
	// }
module.exports = (entry, options) => new Promise((resolve, reject) => {

	options = options || {}

	options.env = object.assign({}, options.env || {})
	const env_client = object.assign({}, options.env || {}, options.env_client || {})
	const env_server = object.assign({}, options.env || {}, options.env_server || {})


	// Server config
	const server_config = getWebpackConfigServer(entry, options.production, env_server)

	const compiler_server = webpack(server_config)

	compiler_server.outputFileSystem = fileSystem

	const args = {}



	// Client config
	const client_config = getWebpackConfigClient(entry, options.production, env_client)

	// console.log(JSON.stringify(client_config, null, 2))

	const compiler_client = webpack(client_config)

	const devMiddleware = webpackDevMiddleware(compiler_client, {
		logLevel: 'silent',
	    serverSideRender: true,
	    // stats: "verbose",
	    watchOptions: {
			// ignored: [path.resolve(__dirname, './**/*')]
		}
	})


	var server_done = false
	var response

	if(options.production === true){

		compiler_server.run((error, stats) => {

			// console.log('\n\n', stats.toString({colors: true}))

			const assetsByChunkName = stats.toJson().assetsByChunkName
			const outputPath = stats.toJson().outputPath


			var scripts = normalizeAssets(assetsByChunkName.main)
				.filter((path) => path.endsWith('.js'))
				.map((path) => fileSystem.readFileSync(outputPath + '/' + path))
				.join('\n')

			args.routes = requireFromString(scripts)

			server_done = true
			resolve([ devMiddleware, render(args) ])
		})


	}
	else {

		SourceMapSupport.install({
			retrieveSourceMap: (args => source => {
				if (source === args.filename) {

					return {
						url: args.filename,
						map: args.sourcemap,
					}
				}
				return null
			})(args)
		})



		// Build Client
		const hotMiddleware = webapckHotMiddleware(compiler_client, {
			log: false
		})



		response = [ devMiddleware, hotMiddleware, render(args) ]


		// Build Server
		compiler_server.watch({ 
		    aggregateTimeout: 300,
		    logLevel: 'silent',
		    watchOptions: {
				// ignored: ['./**/*']
			}
		}, (error, stats) => {

			// console.log('\n\n', stats.toString({colors: true}))

			// console.log(JSON.stringify(stats.toJson(), null, 2))

			if(error){
				console.error(error)
				return reject(error)
			}

			if(stats.hasErrors() || stats.toJson().errors.length > 0){
				console.error(stats.toJson().errors)
				return reject(stats.toJson().errors)
			}


			const assetsByChunkName = stats.toJson().assetsByChunkName
			const outputPath = stats.toJson().outputPath


			var code = normalizeAssets(assetsByChunkName.main)
				.filter((path) => path.endsWith('.js'))
				.map((path) => fileSystem.readFileSync(outputPath + '/' + path))
				.join('\n')

			// console.log(code)

			var sourcemap = normalizeAssets(assetsByChunkName.main)
				.filter((path) => path.endsWith('.map'))
				.map((path) => fileSystem.readFileSync(outputPath + '/' + path))
				.join('\n')

			sourcemap = JSON.parse(sourcemap)

			sourcemap.sources = sourcemap.sources.map(source => {
				return source.replace('webpack://app', path.dirname(entry), '..')
			})

			SourceMapSupport.install({
				retrieveSourceMap: function(source) {
					if (source === entry) {

						return {
							map: sourcemap,
						}
					}
					return null
				}
			})
			
			args.routes = requireFromString(code, entry)

			args.sourcemap = sourcemap
			args.filename = entry

			if(server_done) return
			server_done = true
			resolve(response)

		})
	}
})
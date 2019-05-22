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





module.exports = function(entry, caller, options){

	options = options || {}
	

	if(!path.isAbsolute(entry)){
		entry = path.resolve(caller, '..', entry)
	}


	// Server config
	const server_config = getWebpackConfigServer(entry, options.production)

	const compiler_server = webpack(server_config)

	compiler_server.outputFileSystem = fileSystem

	const args = {}



	// Client config
	const client_config = getWebpackConfigClient(entry, options.production)

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

		})

		return [ devMiddleware, render(args) ]

	}
	else {


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

			if(stats.toJson().errors.length > 0) return


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

			args.routes = requireFromString(code, entry)

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
			args.sourcemap = sourcemap
			args.filename = entry

		})

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



		return [ devMiddleware, hotMiddleware, render(args) ]

	}
}
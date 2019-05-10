"use strict"

const fs 						= require('fs')
const path 						= require('path')
const url 						= require("url")
const webpack 					= require('webpack')
const MemoryFileSystem 			= require('memory-fs')
const requireFromString 		= require('require-from-string')

const webpackDevMiddleware 		= require('webpack-dev-middleware')
const webapckHotMiddleware 		= require("webpack-hot-middleware")

const route 					= require("./build/route")
const componentToHtml 			= require('./build/componentToHtml.js')
const resolveFile 				= require('./build/resolveFile.js')
const getWebpackConfigClient 	= require('./build/getWebpackConfigClient.js')
const getWebpackConfigServer 	= require('./build/getWebpackConfigServer.js')

const mithril 					= require('./server')


const fileSystem 				= new MemoryFileSystem()





function getCallerFile() {

	var origPrepareStackTrace = Error.prepareStackTrace

    try {

    	Error.prepareStackTrace = function (_, stack) { return stack }
        
        var error = new Error()

        var stack = error.stack

        Error.prepareStackTrace = origPrepareStackTrace

        var currentfile = stack.shift().getFileName()

        var callerfile

        while (stack.length) {
            
            callerfile = stack.shift().getFileName()

            if(currentfile !== callerfile) return callerfile
        }
    }
    catch (err) {}
    return undefined;
}



function getRootDir(caller_dir_path){

	var path_array = caller_dir_path.split(path.sep)

	var root_dir

	while(path_array.length > 0){

		var current_dir = path_array.join(path.sep)

		var files_in_dir = fs.readdirSync(current_dir)

		if(files_in_dir.indexOf('package.json') > -1 || files_in_dir.indexOf('node_modules') > -1){

			root_dir = current_dir

			break
		}

		path_array.pop()
	}

	if(!root_dir) throw 'Root directory not found.'

	return root_dir

}




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




const render = args => (req, res) => {

	console.time('Time')

	const assetsByChunkName = res.locals.webpackStats.toJson().assetsByChunkName
	const filesystem = res.locals.fs
	const outputPath = res.locals.webpackStats.toJson().outputPath


	const styles = normalizeAssets(assetsByChunkName.main)
		.filter((path) => path.endsWith('.css'))
		.map((path) => filesystem.readFileSync(outputPath + '/' + path))
		.join('\n')

	var scripts = normalizeAssets(assetsByChunkName.main)
		.filter((path) => path.endsWith('.js'))
		.map((path) => `<script class= "__mithril_pages_scripts__" src="${path}" defer></script>`)
		.join('\n')

	var req_url = req.url

	var fetch_data_only = false

	if(/\.json$/.test(req.url)){
		
		req_url = req_url.replace(/^\/__index__/, '/')

		req_url = req_url.replace(/\.json$/, '')

		fetch_data_only = true
	}


	const store = {}

	const component = route(req_url, args.routes)


	componentToHtml(component.component, component.params, {store: store, path: req.url, data_only: fetch_data_only}).then(view => {

		var hashes = store.__hashes || []
		store.__hashes = undefined
		delete store.__hashes

		const data_path = route.buildDataPath(req_url)
		Object.keys(store).forEach(key => {
			store[key] = {path: data_path, state: store[key]}
		})

		if(fetch_data_only) return res.json(store)
		
		var bundles = hashes.map(hash => {
			return assetsByChunkName[hash]
		})

		scripts = bundles.map(path => `<script class= "__mithril_pages_scripts__" src="${path}" defer></script>`).join('\n') + scripts

		scripts = `<script>window.__mithril_pages_store__ = ${JSON.stringify(store)}</script>` + scripts

		view = view.replace(/__mithril_pages_styles__/, `<style class="__mithril_pages_styles__">${styles}</style>`)
		view = view.replace(/__mithril_pages_scripts__/, scripts)
		// view = view.replace(/__mithril_pages_store__/, JSON.stringify(store))
console.timeEnd('Time')
		res.send(view)
	})
	.catch(console.error)


}




const m = {}

m.init = function(pathname, options){

	options = options || {}
	
	// resolveFile(pathname)

	if(path.isAbsolute(pathname)){
		var filepath = pathname
		var dirpath = path.dirname(pathname)
	}
	else{
		var caller_dir_path = path.dirname(getCallerFile())
		var filepath = path.resolve(caller_dir_path, pathname)
		var dirpath = path.dirname(filepath)
	}

	// Server config
	const server_config = getWebpackConfigServer(filepath, dirpath, options.production)

	const compiler_server = webpack(server_config)

	compiler_server.outputFileSystem = fileSystem

	const args = {}



	// Client config
	const client_config = getWebpackConfigClient(filepath, dirpath, options.production)

	// console.log(JSON.stringify(client_config, null, 2))

	const compiler_client = webpack(client_config)

	const devMiddleware = webpackDevMiddleware(compiler_client, {
	    serverSideRender: true,
	})


	if(options.production === true){

		compiler_server.run((error, stats) => {

			console.log('\n\n', stats.toString({colors: true}))

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
		}, (error, stats) => {

			console.log('\n\n', stats.toString({colors: true}))

			const assetsByChunkName = stats.toJson().assetsByChunkName
			const outputPath = stats.toJson().outputPath


			var scripts = normalizeAssets(assetsByChunkName.main)
				.filter((path) => path.endsWith('.js'))
				.map((path) => fileSystem.readFileSync(outputPath + '/' + path))
				.join('\n')

			args.routes = requireFromString(scripts)

		})



		// Build Client

		const hotMiddleware = webapckHotMiddleware(compiler_client)



		return [ devMiddleware, hotMiddleware, render(args) ]

	}
}



module.exports = m
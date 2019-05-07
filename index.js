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

	const assetsByChunkName = res.locals.webpackStats.toJson().assetsByChunkName
	const filesystem = res.locals.fs
	const outputPath = res.locals.webpackStats.toJson().outputPath


	const styles = normalizeAssets(assetsByChunkName.main)
		.filter((path) => path.endsWith('.css'))
		.map((path) => filesystem.readFileSync(outputPath + '/' + path))
		.join('\n')

	var scripts = normalizeAssets(assetsByChunkName.main)
		.filter((path) => path.endsWith('.js'))
		.map((path) => `<script class= "__mithril_pages_scripts__" src="${path}"></script>`)
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

		scripts = bundles.map(path => `<script class= "__mithril_pages_scripts__" src="${path}"></script>`).join('\n') + scripts

		scripts = `<script>window.__mithril_pages_store__ = ${JSON.stringify(store)}</script>` + scripts

		view = view.replace(/__mithril_pages_styles__/, `<style class="__mithril_pages_styles__">${styles}</style>`)
		view = view.replace(/__mithril_pages_scripts__/, scripts)
		// view = view.replace(/__mithril_pages_store__/, JSON.stringify(store))

		res.send(view)
	})
	.catch(console.error)


}




const m = {}

m.init = function(pathname){
	
	const path_object = resolveFile(pathname)

	const args = {}

	const server_config = getWebpackConfigServer(path_object.filepath, path_object.dirpath)

	const compiler_server = webpack(server_config)

	compiler_server.outputFileSystem = fileSystem

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




	const client_config = getWebpackConfigClient(path_object.filepath, path_object.dirpath)

	const compiler_client = webpack(client_config)

	const devmMiddleware = webpackDevMiddleware(compiler_client, {
	    serverSideRender: true,
	})

	const hotMiddleware = webapckHotMiddleware(compiler_client)





	return [ devmMiddleware, hotMiddleware, render(args) ]
}



module.exports = m
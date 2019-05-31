'use strict'

const fs 						= require('fs')
const path 						= require('path')
const url 						= require("url")
const webpack 					= require('webpack')
const MemoryFileSystem 			= require('memory-fs')
const requireFromString 		= require('require-from-string')
const SourceMapSupport 			= require('source-map-support')
const async 					= require('async')
const mkdirp 					= require('mkdirp')

const getWebpackConfigClient 	= require('./getWebpackConfigClient.js')
const getWebpackConfigServer 	= require('./getWebpackConfigServer.js')

const renderer  				= require('./render')



// This function makes server rendering of asset references consistent with different webpack chunk/entry configurations
function normalizeAssets(bundle_data, filter, chunk) {

	var assets = chunk ? bundle_data.assetsByChunkName[chunk] : bundle_data.assetsByChunkName

	if (typeof assets === 'object') assets = Object.values(assets)

	assets = Array.isArray(assets) ? assets : [assets]

	var filenames = []
	assets.forEach(asset => {
		if(Array.isArray(asset)) asset.forEach(asset => filenames.push(asset))
		else filenames.push(asset)
	})

	assets = filenames.map((filename) => path.resolve(bundle_data.outputPath, filename))

	if(filter) assets = assets.filter(filename => filename.endsWith(filter))

	return assets
}


module.exports = (entry, map, options) => {

	options = options || {}
	
	var fs_cache = {}

	const safeWrite = (filepath, content, callback) => {

		var dirname = path.dirname(filepath)

		var exists = true
		var dir_cache = dirname.split('/').filter(x=>x).reduce((cache, dir) => {
			if(!cache[dir]){
				cache[dir] = {}
				exists = false
			}
			return cache[dir]
		}, fs_cache)

		// dir_cache[path.basename(filepath)] = true


		var series = []
		if(!exists){
			series.push(callback => mkdirp(dirname, callback))
			// series.push((_, callback) => fs.readdir(dirname, callback))
			// series.push((files, callback) => async.parallel(files.map(file => callback => fs.unlink(path.join(dirname, file), callback)), callback))
		}
		series.push((callback) => fs.writeFile(filepath, content, callback))

		async.series(series, callback)
	}


	if(!options.output) options.output = path.resolve(process.cwd(), 'output')
	if(!path.isAbsolute(options.output)) throw new Error("'options.output' must be an absolute path.")


	// Server config
	const server_config = getWebpackConfigServer(entry, true)

	const compiler_server = webpack(server_config)

	compiler_server.outputFileSystem = new MemoryFileSystem()



	// Client config
	const client_config = getWebpackConfigClient(entry, true)

	const compiler_client = webpack(client_config)

	compiler_client.outputFileSystem = new MemoryFileSystem()





	const args = {}

	async.parallel({
		server: callback => compiler_server.run(callback),
		client: callback => compiler_client.run(callback),
	}, (error, bundle) => {

		const client_data = bundle.client.toJson()
		const server_data = bundle.server.toJson()



		// Client data
		if(client_data.errors.length > 0) return console.error('Compile Error')

		const assets = normalizeAssets(client_data, '.js')

		async.parallel(assets.map(filepath => callback => compiler_client.outputFileSystem.readFile(filepath, (error, code) => {
			safeWrite(path.resolve(options.output, '.' + filepath), code, callback)
		})), (error, response) => {
			if(error) console.log(error)
		})






		// Server Data
		var code = normalizeAssets(server_data, '.js', 'main')
			.map((path) => compiler_server.outputFileSystem.readFileSync(path))
			.join('\n')

		args.routes = requireFromString(code, entry)



		// Sourcemaps
		var sourcemap = normalizeAssets(server_data, '.map', 'main')
			.map((path) => compiler_server.outputFileSystem.readFileSync(path))
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

		var render = renderer(args)


		async.series(map
		.sort((a,b) => a.length - b.length)
		.map(url => {
			var tokens = url.split('?')
			var path = tokens[0]
			var query = tokens[1]
			var data_path = path
			data_path = data_path.replace(/\/$/, '')

			var path_tokens = data_path.split('/')

			var file_name = path_tokens.pop()

			file_name = '__mp_' + file_name + '.json'

			path_tokens.push(file_name)

			data_path = path_tokens.join('/') || '/'

			path = path.replace(/^\/$/, '/index').replace(/\/$/, '').replace(/(\.html?)?$/, '.html')

			if(query){
				path = path + '?' + query
				data_path = data_path + '?' + query
			}

			return [path, data_path]
		})
		.reduce((a, b) => a.concat(b), [])
		.map(url => callback => {
			render({url: url}, {
				locals: { webpackStats: bundle.client},
				set: ()=>{},
				status:()=>({
					send: html => {
						safeWrite(path.resolve(options.output, '.' + url), html, callback)
					},
					json: json => {
						safeWrite(path.resolve(options.output, '.' + url), JSON.stringify(json), callback)
					},
				})
			})
		}), error => {
			if(error) console.error(error)
		})

	})

	
}
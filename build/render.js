'use strict'

const fs 						= require('fs')
const path 						= require('path')
const url 						= require('url')
const querystring 				= require('querystring')
const sharp 					= require('sharp')
const sqip 						= require('sqip')
const request 					= require('request')
const m 						= require('./server')
const route 					= require('./route')
const componentToHtml 			= require('./componentToHtml.js')



// Default component generator. Generates simple default pages for 404, 500, and loading pages with status and a message.
function generateDefaultComponent(message, status){

	return {
		headers: function(vnode){
			return {
				status: status
			}
		},

		view: function(vnode) {
			return [
				m('head', [
					m('title', `${status} (${message})`),
				]),
				m('body', [
					m('pre', message),
					m.scripts,
				]),
			]
		}
	}
}


// Render function responds to requests
module.exports = args => (req, res) => {

	console.time('Time')

	// Url Object to be modified
	var req_url = req.url


	// Boolean. When set to true commands the renderer to only return the JSON store data
	var fetch_data_only = false

	var matches = req_url.match(/^(.*)\/__mp_(.*)\.json(.*)$/)

	if(matches){

		req_url = matches[1] + '/' + matches[2] + matches[3]

		fetch_data_only = true
	}

	var tokens = req_url.split('?')
	tokens[0] = tokens[0].replace(/\/$/, '') || '/'
	req_url = tokens.join('?')



	// Status code variable to set the response status
	let status = 200


	// Default Store Object to get passed into the router
	let store = {__pages:{}, __components:{}}

	store.__pages[req_url] = {}


	// Route the request and return the proper page component to render
	let component = route(req_url, args.routes.routes)


	// If no component is returned by the router check if a static file resource should be returned
	if(!component && !fetch_data_only){
		try{

	    	const request_data = url.parse(req_url, true)
	    	const path_data = path.parse(querystring.unescape(request_data.pathname))

	    	// console.log(req_url, JSON.stringify(request_data, null, 4), JSON.stringify(path_data, null, 4))

	    	if(req.query.src){

	    		const src_request_data = url.parse(req.query.src, true)
	    		const src_path_data = path.parse(querystring.unescape(src_request_data.pathname))

	    		// console.log("EEEEEELLLOEOEOEOEOE", req.query.src)
	    		// console.log(src_request_data)
	    		// console.log(src_path_data)

    			if(src_path_data.ext === '.gif'){
    				if(/\.gif$/.test(static_url)){
    					if(request_data.query.height || request_data.query.width){
    						return res.status(400).send({message: 'Image resizer cannot resize .gif images'})
    					}
    					return res.sendFile(req.query.src)
    				}
    				else return res.status(400).send({message: 'Image reformatter cannot export to .gif'})
    			}

    			const types = {
    				'.jpg': 'jpeg',
    				'.jpeg': 'jpeg',
    				'.webp': 'webp',
    				'.png': 'png',
    				'.tiff': 'tiff',
    				'.tif': 'tiff',
    			}

    			const type = types[path_data.ext]


    			let transformer = sharp()

				let height, width, quality

				let valid_positions = ['attention', 'entropy']

				if(!isNaN(request_data.query.height)) height = parseInt(request_data.query.height, 10)
				if(!isNaN(request_data.query.width)) width = parseInt(request_data.query.width, 10)
				if(!isNaN(request_data.query.quality)) quality = parseInt(request_data.query.quality, 10)

				if(height || width){

					const options = {
						width:width,
						height:height,
						fit: sharp.fit.cover,
						withoutEnlargement: true,
					}

					if(req.query.position && valid_positions.indexOf(req.query.position) > -1){

						options.position = sharp.strategy[req.query.position]
					}
					
					transformer = transformer.resize(options)
				}

				transformer = transformer
				.toFormat(type)
				[type]({
					quality:quality,
				})

				transformer = transformer
				.on('error', function(err) {
					console.error(err)
					res.error(err)
				})

    			res.setHeader('Content-Type', 'image/' + type)

    			const headers = Object.assign({},req.headers)
    			delete headers.host
    			delete headers.accept
    			
    			request(req.query.src, {
    				headers: headers
    			})

    			.on('error', console.error)

    			.pipe(transformer)

    			.pipe(res)

	    	}

	    	else if(/^\.(png|jpe?g|gif|webp|tif?f)$/.test(path_data.ext)){

	    		let static_url = querystring.unescape(request_data.pathname)

	    		new Promise((resolve, reject) => {

		    		if(request_data.query.original_ext){
		    			// console.log('HEEEEYY')
		    			resolve(static_url.replace(new RegExp(path_data.ext + '$'), '.' + request_data.query.original_ext))
		    		}
		    		else {
		    			const filename_test = new RegExp('^' + path_data.name + '\\.*.')
		    			fs.readdir(path_data.dir, (err, files) => {
		    				if(err) return reject(err)
							let original_file
							for(let i = 0; i < files.length; i++){
								if(files[i] === path_data.base){
									original_file = files[i]
									// console.log('HIIII')
									break
								}
								else if(filename_test.test(files[i])){
									original_file = files[i]
									// console.log('HELLLLLO')
								}
							}

							if(!original_file) reject()

							resolve(path.resolve(path_data.dir, original_file))
						})
		    		}
	    		})

	    		.then(static_url => {

	    			// console.log(static_url)

	    			if(path_data.ext === '.gif'){
	    				if(/\.gif$/.test(static_url)){
	    					if(request_data.query.height || request_data.query.width){
	    						return res.status(500).error({message: 'Image resizer cannot resize .gif images'})
	    					}
	    					return res.sendFile(static_url)
	    				}
	    				else return res.status(500).error({message: 'Image reformatter cannot export to .gif'})
	    			}

	    			const types = {
	    				'.jpg': 'jpeg',
	    				'.jpeg': 'jpeg',
	    				'.webp': 'webp',
	    				'.png': 'png',
	    				'.tiff': 'tiff',
	    				'.tif': 'tiff',
	    			}

	    			const type = types[path_data.ext]


	    			let transformer = sharp()

					let height, width, quality

					let valid_positions = ['attention', 'entropy']

					if(!isNaN(request_data.query.height)) height = parseInt(request_data.query.height, 10)
					if(!isNaN(request_data.query.width)) width = parseInt(request_data.query.width, 10)
					if(!isNaN(request_data.query.quality)) quality = parseInt(request_data.query.quality, 10)

					if(height || width){

						const options = {
							width:width,
							height:height,
							fit: sharp.fit.cover,
							withoutEnlargement: true,
						}

						if(req.query.position && valid_positions.indexOf(req.query.position) > -1){

							options.position = sharp.strategy[req.query.position]
						}
						
						transformer = transformer.resize(options)
					}

					transformer = transformer
					.toFormat(type)
					[type]({
						quality:quality,
					})

					transformer = transformer
					.on('error', function(err) {
						console.error(err)
						res.error(err)
					})

	    			res.setHeader('Content-Type', 'image/' + type)
	    			
	    			fs.createReadStream(static_url)

	    			.on('error', console.error)

	    			.pipe(transformer)

	    			.pipe(res)

	    		})
	    		.catch(error => {
	    			console.error(error)
	    			res.status(500).error({message: 'Error reformatting or resizing image', error: error})
	    		})
	    	}
	    	else{
	    		
	    		const static_url = querystring.unescape(request_data.pathname)
	    		
	    		const stat = fs.statSync(static_url)

		    	if(stat) return res.sendFile(static_url)
	    	}
		}
		catch(e){console.log(e)}

		return

	}


	// If no component is returned and a static file is not found send the specified 404 page
	if(!component && args.routes.statusResponses['404']){

		component = {component: args.routes.statusResponses['404'], params: {}}
	}

	// If no 404 page is specified, generate and send a default 404 page.
	else if(!component) {
		console.log('No 404 page specified.')
		component = {component: generateDefaultComponent('Not Found', 404), params:{}}
	}

	// function to render component
	function renderComponent(component, store){
		return componentToHtml(
			component.component,
			component.params,
			{
				store: store,
				path: req_url,
				data_only: fetch_data_only,
			}
		)
		.then(response => {

			// Rendered HTML
			let html = response.body


			// Set response headers and status returned by the component
			const headers = response.headers

			if(headers.status) status = headers.status
			delete headers.status

			res.set(headers)


			// Retrieve hashes of bundles required by the response html
			var hashes = store.__hashes || []
			store.__hashes = undefined
			delete store.__hashes


			// Delete the page object that is attached to the store on a page by page basis
			store.__pages = undefined
			delete store.__pages


			// Return the list of components required by the page
			Object.keys(store.__components).forEach(key => {
				store.__components[key] = {path: req_url, state: store.__components[key]}
			})


			// If only the data is requested, respond with the JSON data
			if(fetch_data_only) return res.status(200).json(store)


			// Compile all the bundle assets required by the page
			const assetsByChunkName = res.locals.webpackStats.toJson().assetsByChunkName
			hashes.push('main')

			var bundles = []
			hashes.forEach(hash => {
				var assets = assetsByChunkName[hash]
				if(!Array.isArray(assets)) assets = [assets]
				assets.forEach(asset => {
					if(asset.endsWith('.js')) bundles.push(asset)
				})
			})

			var scripts = `<script>window.__mithril_pages_store__ = ${JSON.stringify(store)}</script>`

			scripts += bundles.map(path => `<script class= "__mithril_pages_scripts__" src="/${path}" defer></script>`).join('\n')


			// Attach assets to the html
			html = html.replace(/__mithril_pages_scripts__/, scripts)

			// Send response
			res.status(status).send(html)

			console.timeEnd('Time')
		})
	}


	renderComponent(component, store)
	.catch(error => {

		
		// If error fetching JSON data respond with json error response
		if(fetch_data_only){
			
			console.error(error)

			return res.status(500).json({status: 500, message: 'Error fetching page JSON data.'})
		}


		// If there is a runtime error in compilation of the page and no 500 page specified return default 500 response
		if(!args.routes.statusResponses || !args.routes.statusResponses['500']){
			
			if(!fetch_data_only) console.log('No 500 page specified. Logging error...')
			
			console.error(error)
			
			return renderComponent({
				component: generateDefaultComponent('Internal Server Error', 500), params: {error: error}
			}, store)
		}


		// If a 500 page is specified render the page with a fresh store object.
		store = {__pages:{}, __components:{}}

		store.__pages[req_url] = {}

		return renderComponent({component: args.routes.statusResponses['500'], params: {error: error}}, store)

	})

}
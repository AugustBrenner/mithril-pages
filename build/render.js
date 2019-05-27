'use strict'

const fs 						= require('fs')
const m 						= require('./server')
const route 					= require("./route")
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

	if(/\.json$/.test(req.url)){

		req_url = req_url.replace(/\.json$/, '.html')

		fetch_data_only = true
	}

	req_url = req_url.replace(/\/?(index(\.html?)?)?$/, '/index.html')

	console.log(req_url)


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
	    	var stat = fs.statSync(req_url)

		    if(stat) return res.sendFile(req_url)
		}
		catch(e){}

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
				strict: true
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
'use strict'

const fs 						= require('fs')
const m 						= require('./server')
const route 					= require("./route")
const componentToHtml 			= require('./componentToHtml.js')

function generateDefaultComponent(text, status){

	return {
		headers: function(vnode){
			return {
				status: status
			}
		},

		view: function(vnode) {
			return [
				m('head', [
					m('title', `${status} (${text})`),
				]),
				m('body', [
					m('pre', text),
					m.scripts,
				]),
			]
		}
	}
}


module.exports = args => (req, res) => {

	console.time('Time')

	var req_url = req.url

	var fetch_data_only = false

	if(/\.json$/.test(req.url)){

		// console.log('URL', req.url)
		
		req_url = req_url.replace(/^\/__index__/, '/')

		req_url = req_url.replace(/\.json$/, '')

		fetch_data_only = true
	}

	let status = 200

	let store = {__pages:{}, __components:{}}

	store.__pages[req_url] = {}

	let component = route(req_url, args.routes.routes)



	if(!component && !fetch_data_only){
		try{
	    	var stat = fs.statSync(req_url)

		    if(stat) return res.sendFile(req_url)
		}
		catch(e){}

	}



	if(!component && args.routes.statusResponses['404']){

		component = {component: args.routes.statusResponses['404'], params: {}}
	}

	else if(!component) {
		console.log('No 404 page specified.')
		component = {component: generateDefaultComponent('Not Found', 404), params:{}}
	}



	function renderComponent(component, store){
		return componentToHtml(component.component, component.params, {store: store, path: req_url, data_only: fetch_data_only, strict: true}).then(response => {
			let html = response.body
			const headers = response.headers

			if(headers.status) status = headers.status
			delete headers.status

			res.set(headers)

			var hashes = store.__hashes || []
			store.__hashes = undefined
			delete store.__hashes


			// console.log(JSON.stringify(store, null, 2))
			store.__pages = undefined
			delete store.__pages

			Object.keys(store.__components).forEach(key => {
				store.__components[key] = {path: req_url, state: store.__components[key]}
			})

			if(fetch_data_only) return res.json(store)

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

			scripts += bundles.map(path => `<script class= "__mithril_pages_scripts__" src="${path}" defer></script>`).join('\n')

			html = html.replace(/__mithril_pages_scripts__/, scripts)

			res.status(status).send(html)

			console.timeEnd('Time')
		})
	}
	renderComponent(component, store)
	.catch(error => {


		if(fetch_data_only || !args.routes.statusResponses || !args.routes.statusResponses['500']){
			if(!fetch_data_only) console.log('No 500 page specified. Logging error...')
			console.error(error)
			return renderComponent({
				component: generateDefaultComponent('Internal Server Error', 500), params: {error: error}
			}, store)
		}

		store = {__pages:{}, __components:{}}

		store.__pages[req_url] = {}

		return renderComponent({component: args.routes.statusResponses['500'], params: {error: error}}, store)

	})

}
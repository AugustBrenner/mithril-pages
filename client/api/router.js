"use strict"

var Vnode = require("../render/vnode")
//<<<<<<< Modified: Require path changed to original mithril components
var Promise = require("../../mithril/promise/promise")
var coreRouter = require("../router/router")
var request = require("../../mithril/request.js").request
var buildQueryString = require("../../mithril/querystring/build")
//=======
// var Promise = require("../promise/promise")
// var coreRouter = require("../router/router")
//>>>>>>>

module.exports = function($window, redrawService) {
	var routeService = coreRouter($window)

	var identity = function(v) {return v}
	var render, component, attrs, currentPath, lastUpdate, routesObject, storeObject
	//<<<<<<< Modified: Added store to route parameters
	var route = function(root, defaultRoute, routes, store) {
		routesObject = routes
		if(!store) store = {}
		storeObject = store
		if(typeof store !== "object") throw new Error("Ensure the store argument is type 'object'.")

	//=======
	// var render, component, attrs, currentPath, lastUpdate
	// var route = function(root, defaultRoute, routes) {
	//>>>>>>>
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		function run() {
			//<<<<<<< Modified: Added store to vnode
			if (render != null) redrawService.render(root, render(Vnode(component, attrs.key, attrs, store)))
			//=======
			// if (render != null) redrawService.render(root, render(Vnode(component, attrs.key, attrs)))
			//>>>>>>>
		}
		var redraw = function() {
			run()
			redraw = redrawService.redraw
		}
		redrawService.subscribe(root, run)
		var bail = function(path) {
			if (path !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true})
			else throw new Error("Could not resolve default route " + defaultRoute)
		}
		routeService.defineRoutes(routes, function(payload, params, path, route) {
			//<<<<<<< Modified: Added Lazy route loading
			var asyncComponent

			if(payload.resolve){
				asyncComponent = payload
				payload = payload.component || payload.placeholder
			}

			var update = lastUpdate = function(routeResolver, comp) {
				if (update !== lastUpdate) return
				component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div"
				attrs = params, currentPath = path, lastUpdate = null
				render = (routeResolver.render || identity).bind(routeResolver)
				redraw()
			}
			if(payload){
				if (payload.view || typeof payload === "function") update({}, payload)
				else {
					if (payload.onmatch) {
						Promise.resolve(payload.onmatch(params, path, route)).then(function(resolved) {
							update(payload, resolved)
						}, bail)
					}
					else update(payload, "div")
				}
			}


			if(asyncComponent && !asyncComponent.resolved){
				asyncComponent.resolve().then(component => {
					lastUpdate = update
					update({}, component)
				})
			}
			//=======
			// var update = lastUpdate = function(routeResolver, comp) {
			// 	if (update !== lastUpdate) return
			// 	component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div"
			// 	attrs = params, currentPath = path, lastUpdate = null
			// 	render = (routeResolver.render || identity).bind(routeResolver)
			// 	redraw()
			// }
			// if (payload.view || typeof payload === "function") update({}, payload)
			// else {
			// 	if (payload.onmatch) {
			// 		Promise.resolve(payload.onmatch(params, path, route)).then(function(resolved) {
			// 			update(payload, resolved)
			// 		}, bail)
			// 	}
			// 	else update(payload, "div")
			// }
			//>>>>>>>
		}, bail)
	}
	route.set = function(path, data, options) {
		if (lastUpdate != null) {
			options = options || {}
			options.replace = true
		}
		lastUpdate = null
		routeService.setPath(path, data, options)
	}
	route.get = function() {return currentPath}
	route.prefix = function(prefix) {routeService.prefix = prefix}
	var link = function(options, vnode) {
		//<<<<<<< Modified: Lazy load any missing components that are linked to
		var href = routeService.prefix + vnode.attrs.href
		vnode.dom.setAttribute("href", href)

		if(!vnode.state._href || vnode.state._href !== href){
			routeService.matchRoute(vnode.dom.getAttribute("href"), routesObject, function(component, params, path, route){

				// console.log(route)

				if(component.resolve){

					if(!component.resolved){

						var should_load = (component.options.load || m.lazy.config.load) === 'ref'

						if(options.preload === true || options.preload === false) should_load = options.preload

						if(should_load) component.resolve()

					}
				}

				var should_fetch_state = false

				if(options.prefetch === true || options.prefetch === false) should_fetch_state = options.prefetch

				if(should_fetch_state){

					var data_path = routeService.buildDataPath(path)

					var pathsObject = storeObject[data_path] || {}

					var expired = false

					var data_paths = Object.keys(pathsObject)

					if(data_paths.length === 0){
						expired = true
					}
					else{
						data_paths.forEach(function(path){
							if(pathsObject[path] < Date.now()) expired = true
						})
					}

					if(expired){
						request(data_path).then(function(data){

							Object.keys(data).forEach(function(key){
								var cache = data[key]
								cache.createdAt = Date.now()
								try{
									cache.state = JSON.parse(cache.state)
								}
								catch(e){
									console.log(e)
								}

								var strategy = cache.state.cache

								if(strategy === false) cache.expiresAt = 0
							    if(strategy === true || strategy === null || strategy === undefined) cache.expiresAt = Infinity
							    if(typeof strategy === 'number') cache.expiresAt = cache.createdAt + strategy
							    if(typeof strategy === 'string' || strategy instanceof Date) cache.expiresAt = new Date(strategy).getTime()
								storeObject[key] = cache

								if(!storeObject[cache.path]) storeObject[cache.path] = {}

								storeObject[cache.path][key] = cache.expiresAt
							})
						})
						.catch(console.log)
					}
				}

			}, function(error){
				console.log('ERROR', error)
			})
			vnode.state._href = href
		}
		//=======
		// vnode.dom.setAttribute("href", routeService.prefix + vnode.attrs.href)
		//>>>>>>>
		vnode.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault()
			e.redraw = false
			var href = this.getAttribute("href")
			if (href.indexOf(routeService.prefix) === 0) href = href.slice(routeService.prefix.length)
			route.set(href, undefined, options)
		}
	}
	route.link = function(args) {
		if (args.tag == null) return link.bind(link, args)
		return link({}, args)
	}
	route.param = function(key) {
		if(typeof attrs !== "undefined" && typeof key !== "undefined") return attrs[key]
		return attrs
	}

	return route
}

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
		routesObject = routes.routes
		storeObject = store
		if(typeof store !== "object") throw new Error("Ensure the store argument is type 'object'.")
	//=======
	// var render, component, attrs, currentPath, lastUpdate
	// var route = function(root, defaultRoute, routes) {
	//>>>>>>>
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		function run() {
			//<<<<<<< Modified: Added store to vnode
			if (render != null){
				try{
					redrawService.render(root, render(Vnode(component, attrs.key, attrs, store)))
				}
				catch(e){
					document.documentElement.vnodes = null
					if(component.view) delete component.view.$$reentrantLock$$
					attrs.error = e
					if(routes.statusResponses && routes.statusResponses['500']){
						redrawService.render(root, render(Vnode(routes.statusResponses['500'], attrs.key, attrs, store)))
					}
				}
			}
			//=======
			// if (render != null) redrawService.render(root, render(Vnode(component, attrs.key, attrs)))
			//>>>>>>>
		}
		var redraw = function() {
			run()
			redraw = redrawService.redraw
		}
		redrawService.subscribe(root, run)
		//<<<<<<< Modified: Added store to vnode
		//=======
		// var bail = function(path) {
		// 	if (path !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true})
		// 	else throw new Error("Could not resolve default route " + defaultRoute)
		// }
		//>>>>>>>
		routeService.defineRoutes(routesObject, function(payload, params, path, route) {

			//<<<<<<< Modified: Added store to vnode
			if(!payload){
				if(routes.statusResponses && routes.statusResponses['404']){
					payload = routes.statusResponses['404']
					console.log('Not Found')
				}
				else{
					if (path !== defaultRoute) return routeService.setPath(defaultRoute, null, {replace: true})
					else throw new Error("Could not resolve default route " + defaultRoute)
				}
			}
			//=======
			//>>>>>>>

			//<<<<<<< Modified: Added Lazy route loading
			var update = lastUpdate = function(routeResolver, comp) {
				if (update !== lastUpdate) return

				var key = path.split('#')[0]
				storeObject.__page = {}

				component = comp != null && (typeof comp.view === "function" || typeof comp === "function") ? comp : "div"
				attrs = params, currentPath = path, lastUpdate = null
				render = (routeResolver.render || identity).bind(routeResolver)
				redraw()
			}

			var asyncComponent

			if(payload.resolve){
				asyncComponent = payload
				payload = payload.component || payload.placeholder
			}

			if(asyncComponent && asyncComponent.resolved){
				asyncComponent.resolve().then(component => {
					lastUpdate = update
					update({}, component)
				})
			}
			else if(payload){
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
		})
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

				if(!component) return

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

					var cache_path = routeService.buildPath(path)

					var pageObject = storeObject.__pages[cache_path] = storeObject.__pages[cache_path] || {__components:{}}

					var expired = false

					var component_keys = Object.keys(pageObject.__components)

					if(component_keys.length === 0){
						expired = true
					}
					else{
						component_keys.forEach(function(path){
							if(pageObject[path] < Date.now()) expired = true
						})
					}

					if(expired){
						var data_path = routeService.buildDataPath(cache_path)
						request(data_path).then(function(data){

							Object.keys(data.__components).forEach(function(key){
								var cache = data.__components[key]
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

								storeObject.__components[key] = cache

								if(!storeObject.__page[cache.path]) storeObject.__page[cache.path] = {__components:{}}

								storeObject.__page[cache.path].__components[key] = cache.expiresAt
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

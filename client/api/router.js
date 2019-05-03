"use strict"

var Vnode = require("../render/vnode")
//<<<<<<< Modified: Require path changed to original mithril components
var Promise = require("../../mithril/promise/promise")
var coreRouter = require("../../mithril/router/router")
//=======
// var Promise = require("../promise/promise")
// var coreRouter = require("../router/router")
//>>>>>>>

module.exports = function($window, redrawService) {
	var routeService = coreRouter($window)

	var identity = function(v) {return v}
	var render, component, attrs, currentPath, lastUpdate
	//<<<<<<< Modified: Added store to route parameters
	var route = function(root, defaultRoute, routes, store) {
		if(!store) store = {}
		if(typeof store !== "object") throw new Error("Ensure the store argument is type 'object'.")
	//=======
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
				console.log(!!update, !!lastUpdate)
				console.log(comp)
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
		vnode.dom.setAttribute("href", routeService.prefix + vnode.attrs.href)
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

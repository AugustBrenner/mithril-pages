"use strict"

//<<<<<<< Modified: Added store to vnode
var buildQueryString = require("../../mithril/querystring/build")
var parseQueryString = require("../../mithril/querystring/parse")
//=======
// var buildQueryString = require("../querystring/build")
// var parseQueryString = require("../querystring/parse")
//>>>>>>>

module.exports = function($window) {
	var supportsPushState = typeof $window.history.pushState === "function"
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout

	function normalize(fragment) {
		var data = $window.location[fragment].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
		if (fragment === "pathname" && data[0] !== "/") data = "/" + data
		return data
	}

	var asyncId
	function debounceAsync(callback) {
		return function() {
			if (asyncId != null) return
			asyncId = callAsync(function() {
				asyncId = null
				callback()
			})
		}
	}

	//<<<<<<< Modified: Added store to vnode
	var router = {prefix: "#!"}

	router.parsePath = function(path, queryData, hashData) {
		var queryIndex = path.indexOf("?")
		var hashIndex = path.indexOf("#")
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length
			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
			for (var key in queryParams) queryData[key] = queryParams[key]
		}
		if (hashIndex > -1) {
			var hashParams = parseQueryString(path.slice(hashIndex + 1))
			for (var key in hashParams) hashData[key] = hashParams[key]
		}
		return path.slice(0, pathEnd)
	}

	function buildPath(path, replacement){

		if(!path) path = $window.location.pathname + $window.location.search

		var queryData = {}

		var data_path = router.parsePath(path, queryData, {})

		data_path = data_path.replace(/\/$/, '')

		var path_tokens = data_path.split('/')

		var file_name = path_tokens.pop()

		if(replacement){
			file_name = '__mp_' + file_name + replacement
		}

		path_tokens.push(file_name)

		data_path = path_tokens.join('/') || '/'

		var query = buildQueryString(queryData)

		if (query) data_path += "?" + query

		return data_path
	}

	router.buildPath = function(path){
		return buildPath(path)
	}

	router.buildDataPath = function(path){
		return buildPath(path, '.json')
	}
	//=======
	// function parsePath(path, queryData, hashData) {
	// 	var queryIndex = path.indexOf("?")
	// 	var hashIndex = path.indexOf("#")
	// 	var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
	// 	if (queryIndex > -1) {
	// 		var queryEnd = hashIndex > -1 ? hashIndex : path.length
	// 		var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
	// 		for (var key in queryParams) queryData[key] = queryParams[key]
	// 	}
	// 	if (hashIndex > -1) {
	// 		var hashParams = parseQueryString(path.slice(hashIndex + 1))
	// 		for (var key in hashParams) hashData[key] = hashParams[key]
	// 	}
	// 	return path.slice(0, pathEnd)
	// }

	// var router = {prefix: "#!"}
	//>>>>>>>
	router.getPath = function() {
		var type = router.prefix.charAt(0)
		switch (type) {
			case "#": return normalize("hash").slice(router.prefix.length)
			case "?": return normalize("search").slice(router.prefix.length) + normalize("hash")
			default: return normalize("pathname").slice(router.prefix.length) + normalize("search") + normalize("hash")
		}
	}
	router.setPath = function(path, data, options) {
		var queryData = {}, hashData = {}
		//<<<<<<< Modified: Added store to vnode
		path = router.parsePath(path, queryData, hashData)
		//=======
		// path = parsePath(path, queryData, hashData)
		//>>>>>>>
		if (data != null) {
			for (var key in data) queryData[key] = data[key]
			path = path.replace(/:([^\/]+)/g, function(match, token) {
				delete queryData[token]
				return data[token]
			})
		}

		var query = buildQueryString(queryData)
		if (query) path += "?" + query

		var hash = buildQueryString(hashData)
		if (hash) path += "#" + hash

		if(!path) path = $window.location.pathname

		if (supportsPushState) {
			var state = options ? options.state : null
			var title = options ? options.title : null
			$window.onpopstate()
			if (options && options.replace) $window.history.replaceState(state, title, router.prefix + path)
			else $window.history.pushState(state, title, router.prefix + path)
		}
		else $window.location.href = router.prefix + path
	}
	//<<<<<<< Modified: Added store to vnode
	router.matchRoute = function(path, routes, resolve){

		var params = {query: {}, params: {}, hash: {}, history: {}}

		var pathname = router.parsePath(path, params.query, params.hash)

		var state = $window.history.state
		if (state != null) {
			for (var k in state) params.history[k] = state[k]
		}

		for (var route in routes) {
			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")
			if (matcher.test(pathname)) {
				pathname.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g) || []
					var values = [].slice.call(arguments, 1, -2)
					for (var i = 0; i < keys.length; i++) {
						params.params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
					}
					resolve(routes[route], params, path, route)
				})
				return
			}
		}

		resolve(null, params, path, route)
	}

	router.defineRoutes = function(routes, resolve) {
		function resolveRoute() {

			var path = router.getPath()
			
			router.matchRoute(path, routes, resolve)
		}

		if (supportsPushState) $window.onpopstate = debounceAsync(resolveRoute)
		else if (router.prefix.charAt(0) === "#") $window.onhashchange = resolveRoute
		resolveRoute()
	}
	//=======
	// router.defineRoutes = function(routes, resolve, reject) {
	// 	function resolveRoute() {
	// 		var path = router.getPath()
	// 		var params = {}
	// 		var pathname = parsePath(path, params, params)

	// 		var state = $window.history.state
	// 		if (state != null) {
	// 			for (var k in state) params[k] = state[k]
	// 		}
	// 		for (var route in routes) {
	// 			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

	// 			if (matcher.test(pathname)) {
	// 				pathname.replace(matcher, function() {
	// 					var keys = route.match(/:[^\/]+/g) || []
	// 					var values = [].slice.call(arguments, 1, -2)
	// 					for (var i = 0; i < keys.length; i++) {
	// 						params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
	// 					}
	// 					resolve(routes[route], params, path, route)
	// 				})
	// 				return
	// 			}
	// 		}

	// 		reject(path, params)
	// 	}

	// 	if (supportsPushState) $window.onpopstate = debounceAsync(resolveRoute)
	// 	else if (router.prefix.charAt(0) === "#") $window.onhashchange = resolveRoute
	// 	resolveRoute()
	// }
	//>>>>>>>



	return router
}

'use strict'


var m 				 = require("../client/hyperscript.js")
var buildQueryString = require("../mithril/querystring/build")
var parseQueryString = require("../mithril/querystring/parse")
var url 			 = require("url")


function parsePath(path, queryData, hashData) {
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


function normalize(url_part, fragment) {

	var data = url_part.replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
	if (fragment === "pathname" && data[0] !== "/") data = "/" + data
	return data
}

var Router = function(originalUrl, routes){

	var matchRoutes = function(pathname, query){

		var args = {}

		args.query = query

		var results = {component: null, params: args}

		pathname = pathname.replace(/index.html$/, '')

		for (var route in routes) {
			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")
			if (matcher.test(pathname)) {
				pathname.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g) || []
					var values = [].slice.call(arguments, 1, -2)
					var params = {}
					for (var i = 0; i < keys.length; i++) {
						params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
					}
					args.params = params

					results = {component: routes[route], params: args}
				})
				break
			}
		}

		if(!results.component){

			return null
		}

		if(results.component.view) return results

		if (results.component.onmatch) {

			results.component = results.component.onmatch(results.params, pathname)

			return results
		}

		return results
	}


		
	var url_object = url.parse(originalUrl)

	var path = normalize(url_object.pathname || '', "pathname") + normalize(url_object.search || '?', "search")

	var params = {}
	var pathname = parsePath(path, params, params)


	return matchRoutes(pathname, params)
}





Router.buildDataPath = function(path){

	if(!path) path = $window.location.pathname + $window.location.search

	var queryData = {}

	var data_path = parsePath(path, queryData, {})

	if(data_path ===  '/') data_path += '__index__'

	var query = buildQueryString(queryData)
	if (query) data_path += "?" + query
	data_path += '.json'

	return data_path
}
















module.exports = Router
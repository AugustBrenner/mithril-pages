"use strict"

const hyperscript = require("../client/hyperscript")
const m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment

var requestService = require("./request")

m.redraw = function(){}
m.redraw.sync = function(){}

m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = require("../mithril/querystring/parse")
m.buildQueryString = require("../mithril/querystring/build")

m.version = "bleeding-edge"
m.vnode = require("../client/render/vnode")
m.PromisePolyfill = require("../mithril/promise/polyfill")


m.styles = '__mithril_pages_styles__'
m.scripts = '__mithril_pages_scripts__'

m.route = function(){}
m.route.set = function(){}
m.route.get = function(){} // Polyfill
m.route.link = function(){}
m.route.param = function(){} // Polyfill

m.lazy = {
	load: function(){},
	fetch: function(){},
	require: function(component, options, fileHash){
		component.__hash = fileHash
		return component
	}
}

Object.defineProperty(m, "target", {
    value: "server",
    writable: false
})


function Stylesheet(styleObject){

	var self = this

	var map = styleObject.locals

	Object.keys(map).forEach(function(key){
		self[key] = map[key]
	})
	self.__path = styleObject[0][0]
	self.__ruleset = styleObject.toString()
}

Stylesheet.prototype.render = function(){
	var self = this
	return m({
		view: function(vnode){
			if(!vnode.page.__styles) vnode.page.__styles = {}
			if(vnode.page.__styles[self.__path]){
				return null
			}
			vnode.page.__styles[self.__path] = true
			return m('style', {type:"text/css", key: self.__path}, self.__ruleset)
		}
	})
}

function Stylestore(){
	var self = this
	self.styles = {}

	return function(styleObject){
		
		if(!styleObject) throw new Error('m.style() requires a properly formatted style object argument.')

		var path = styleObject[0][0]

		if(self.styles[path]) return self.styles[path]

		var stylesheet = new Stylesheet(styleObject)

		return stylesheet
	}
}

m.styles = new Stylestore()

module.exports = m
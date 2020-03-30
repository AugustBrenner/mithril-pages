"use strict"

var hyperscript = require("./hyperscript")
var m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment

//<<<<<<< Modified: Require path changed to original mithril components
var requestService = require("../mithril/request")
//=======
// var requestService = require("./request")
//>>>>>>>
var redrawService = require("./redraw")

requestService.setCompletionCallback(redrawService.redraw)

// m.mount = require("./mount")
m.route = require("./route")
m.render = require("./render").render
m.redraw = redrawService.redraw
m.request = requestService.request
m.jsonp = requestService.jsonp
//<<<<<<< Modified: Require path changed to original mithril components
m.parseQueryString = require("../mithril/querystring/parse")
m.buildQueryString = require("../mithril/querystring/build")
//=======
// m.parseQueryString = require("./querystring/parse")
// m.buildQueryString = require("./querystring/build")
//>>>>>>>
m.version = "bleeding-edge"
m.vnode = require("./render/vnode")
//<<<<<<< Modified: Require path changed to original mithril components
m.PromisePolyfill = require("../mithril/promise/polyfill")
//=======
// m.PromisePolyfill = require("./promise/polyfill")
//>>>>>>>

//<<<<<<< Modified: Require path changed to original mithril components
m.lazy = require("./lazy/lazy")
m.lazy.setRedraw(m.redraw)
//=======
//>>>>>>>

Object.defineProperty(m, "target", {
    value: "client",
    writable: false
})

m.env = PLACEHOLDER_FOR_ENVIRONMENT_VARIABLES


function Stylesheet(styleObject){

	var self = this

	var map = styleObject.locals || {}

	Object.keys(map).forEach(function(key){
		self[key] = map[key]
	})
	self.__path = styleObject[0][0]
	self.__ruleset = styleObject.toString()

	self.stylesheet = m({
		view: function(vnode){
			if(!vnode.page.__styles) vnode.page.__styles = {}
			if(vnode.page.__styles[self.__path]){
				return null
			}
			vnode.page.__styles[self.__path] = true
			return m('style', {type:"text/css"}, self.__ruleset)
		},
	}, {
		key: self.__path,
	})
}

Stylesheet.prototype.render = function(page){

	return this.stylesheet
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

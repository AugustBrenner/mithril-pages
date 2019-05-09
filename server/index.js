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
	require: function(component, fileHash){
		component.__hash = fileHash
		return component
	}
}

Object.defineProperty(m, "target", {
    value: "server",
    writable: false
})

module.exports = m
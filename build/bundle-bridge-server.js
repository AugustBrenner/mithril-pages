'use strict'

var m 			= require('mithril-pages')
var routes 		= require('PLACEHOLDER_FOR_ENTRY')


var BundleBridge = {}

BundleBridge.oninit = function(vnode){

	m.store = vnode.attrs.store
	m.request = vnode.attrs.requestHandler.request
	m.jsonp = vnode.attrs.requestHandler.jsonp
	m.env = vnode.attrs.environment_variables
}

BundleBridge.view = function(vnode){
	
	return m(vnode.attrs.component, vnode.attrs.params)
}

module.exports = {
	bridge: BundleBridge,
	routes: routes,
}
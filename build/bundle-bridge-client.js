'use strict'

var m 			= require('mithril-pages')
var routes 		= require('PLACEHOLDER_FOR_ENTRY')

m.route.prefix('')


m.scripts = m.trust(
	Array.from(document.getElementsByClassName('__mithril_pages_scripts__')).map(function(elem){
		return elem.outerHTML
	}).join('')
)


m.lazy.resolveAvailable().then(function(){

	var store = window.__mithril_pages_store__
	if(!store.__components) store.__components = {}
	if(!store.__pages) store.__pages = {}
	m.route(document.documentElement, '/', routes, window.__mithril_pages_store__)
})

if (module.hot) {
	module.hot.accept()
}


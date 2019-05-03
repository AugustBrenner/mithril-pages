'use strict'

var m 			= require('mithril-pages')
var routes 		= require('PLACEHOLDER_FOR_ENTRY')

m.route.prefix('')


m.scripts = m.trust(
	Array.from(document.getElementsByClassName('__mithril_pages_scripts__')).map(function(elem){
		return elem.outerHTML
	}).join('')
)
m.styles = m.trust(
	Array.from(document.getElementsByClassName('__mithril_pages_styles__')).map(function(elem){
		return elem.outerHTML
	}).join('')
)

m.route(document.documentElement, '/', routes, window.__mithril_pages_store__)

if (module.hot) {
	module.hot.accept()
}


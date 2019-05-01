'use strict'

var m 			= require('mithril-pages')
var routes 		= require('PLACEHOLDER_FOR_ENTRY')

m.route.prefix('')

m.route(document.documentElement, '/', routes, window.__mithril_pages_store__)

if (module.hot) {
	module.hot.accept()
}
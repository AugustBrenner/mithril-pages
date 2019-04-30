'use strict'

var m 			= require('mithril-pages')
var routes 		= require('PLACEHOLDER_FOR_ENTRY')

m.route.prefix('')

m.route(document.documentElement, '/', routes)

if (module.hot) {
	module.hot.accept()
}
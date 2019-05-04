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

m.mount = require("./mount")
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


//<<<<<<< Modified: asyncRequire

m.lazy = {
	config: {
		load: 'ref',
		data: 'ref',
	},
	components: {
		load: function(load){m.lazy.config.load = load},
		data: function(data){m.lazy.config.data = data},
	}
}

function componentStore(){

	var self = this

	self.components = {}

	return function(promise, placeholder, options, key){

		options = options || {}

		var component = {
			promise: promise,
			resolved: false,
			component: undefined,
			placeholder: placeholder,
			options: options,
			key: key,
			resolve: function(){
				var comp = self.components[key]
				if(comp.resolved && comp.component) return Promise.resolve(comp.component)
				else{
					return comp.promise().then(component => {
						console.log('COMPONENT', component.key)
						comp.component = component
						comp.resolved = true
						return component
					})
				}
			}
		}
		
		self.components[key] = component

		setTimeout(function(){

			var should_load = options.load || m.lazy.config.load

			if(should_load === 'pre') component.resolve()
		},)


		return component
	}
}

m.lazy.require = new componentStore()
//=======
//>>>>>>>

module.exports = m

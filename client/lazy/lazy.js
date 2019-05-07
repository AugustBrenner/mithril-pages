'use strict'



var lazy = {
	config: {
		load: 'ref',
		fetch: 'ref',
		retry: 3,
		cache: {},
		redraw: undefined,
	},
	components: {
		load: set('load'),
		fetch: set('fetch'),
		retry: set('retry'),
		cache: set('cache'),
	}
}

lazy.setRedraw = set('redraw')

function set(key){
	return function(x){
		lazy.config[key] = x
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
			error: undefined,
			options: options,
			key: key,
			resolving: false, 
			resolve: function(redraw){
				var comp = self.components[key]
				if(comp.resolved && comp.component) return Promise.resolve(comp.component)
				else{
					if(comp.resolving) return Promise.resolve(comp.component)
					comp.resolving = true
					return new Promise(function(resolve, reject){
						setTimeout(function(){
							return comp.promise().then(component => {
								comp.component = component
								resolve(component)
							})
							.catch(error => {
								console.log(error)
								comp.component =  comp.error
								resolve(comp.component)
							})
							.finally(function(){
								comp.resolved = true
								comp.resolving = false
								setTimeout(function(){
									lazy.config.redraw()
								},0)
							})
						},0)
					})
				}
			}
		}
		
		self.components[key] = component

		setTimeout(function(){

			var should_load = options.load || lazy.config.load

			if(should_load === 'pre') component.resolve()
		},)


		return component
	}
}

lazy.require = new componentStore()

module.exports = lazy

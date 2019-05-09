'use strict'



var lazy = {
	config: {
		load: 'ref',
		fetch: 'ref',
		retry: 3,
		redraw: undefined,
	},
	load: set('load'),
	fetch: set('fetch'),
	retry: set('retry'),
	setRedraw:set('redraw'),
	components: {},
	require: function(promise, placeholder, options, key, name){

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
			name: name,
			resolve: function(redraw){
				var comp = lazy.components[key]

				if(comp.resolved && comp.component) return Promise.resolve(comp.component)
				// else if(comp.resolving) return Promise.resolve(comp.component)

				// comp.resolving = true

				return comp.promise().then(component => {
					comp.component = component
					return component
				})
				.catch(error => {
					console.log(error)
					comp.component =  comp.error
					return comp.component
				})
				.finally(function(){
					comp.resolved = true
					comp.resolving = false
					setTimeout(function(){
						lazy.config.redraw()
					},0)
				})
			}
		}



		var has_loaded = window["webpackJsonpapp"].reduce((loaded, bundle) => {
			console.log(bundle)
			return loaded || bundle[0][0] === key
		}, null)


		if(has_loaded) component.resolved = true


		setTimeout(function(){

			var should_load = options.load || lazy.config.load

			if(should_load === 'pre') component.resolve()
		})

		lazy.components[key] = component

		return component
	},
	
	resolveAvailable: function(){

		var promises = []

		Object.keys(lazy.components).forEach(key => {
			
			var component = lazy.components[key]

			if(component.resolved && !component.component) promises.push(component.resolve())

		})

		if(promises.length === 0) return Promise.resolve()

		return Promise.all(promises).then((response)=>{
			return lazy.resolveAvailable()
		})
	}
}

function set(key){
	return function(x){
		lazy.config[key] = x
	}
}

module.exports = lazy

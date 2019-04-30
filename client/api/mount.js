"use strict"

var Vnode = require("../render/vnode")

module.exports = function(redrawService) {
	//<<<<<<< Modified: Added store to mount paramters
	return function(root, component, store) {
	//=======
	// return function(root, component) {
	//>>>>>>>
		if (component === null) {
			redrawService.render(root, [])
			redrawService.unsubscribe(root)
			return
		}
		
		if (component.view == null && typeof component !== "function") throw new Error("m.mount(element, component) expects a component, not a vnode")
		
		var run = function() {
			//<<<<<<< Modified: Added store to vnode
			redrawService.render(root, Vnode(component, undefined, undefined, store))
			//=======
			// redrawService.render(root, Vnode(component))
			//>>>>>>>
		}
		redrawService.subscribe(root, run)
		run()
	}
}

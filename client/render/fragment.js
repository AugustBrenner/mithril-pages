"use strict"

var Vnode = require("../render/vnode")
var hyperscriptVnode = require("./hyperscriptVnode")

module.exports = function() {
	var vnode = hyperscriptVnode.apply(0, arguments)

	vnode.tag = "["
	//<<<<<<< Modified: Added store to vnode
	vnode.children = Vnode.normalizeChildren(vnode.children, vnode.store)
	//=======
	// vnode.children = Vnode.normalizeChildren(vnode.children)
	//>>>>>>>
	return vnode
}

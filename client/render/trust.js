"use strict"

var Vnode = require("../render/vnode")

module.exports = function(html) {
	if (html == null) html = ""
	//<<<<<<< Modified: Added store to vnode
	return Vnode("<", undefined, undefined, undefined, html, undefined, undefined)
	//=======
	// return Vnode("<", undefined, undefined, html, undefined, undefined)
	//>>>>>>>
}

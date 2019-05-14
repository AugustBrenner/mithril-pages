"use strict"

//<<<<<<< Modified: Added store to vnode
function Vnode(tag, key, attrs, store, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs, store: store, page: store ? store.__page : undefined, children: children, text: text, dom: dom, domSize: undefined, state: undefined, events: undefined, instance: undefined}
//=======
// function Vnode(tag, key, attrs, children, text, dom) {
// 	return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: undefined, events: undefined, instance: undefined}
//>>>>>>>
}
//<<<<<<< Modified: Added store to vnode
Vnode.normalize = function(node, store) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, store, Vnode.normalizeChildren(node, store), undefined, undefined)
	if (node != null && typeof node !== "object") return Vnode("#", undefined, undefined, store, node === false ? "" : node, undefined, undefined)	
//=======
// Vnode.normalize = function(node) {
	// if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	// if (node != null && typeof node !== "object") return Vnode("#", undefined, undefined, node === false ? "" : node, undefined, undefined)
//>>>>>>>
	return node
}
Vnode.normalizeChildren = function(input, store) {
	var children = []
	//<<<<<<< Modified: Added store to vnode
	for (var i = 0; i < input.length; i++) {
		children[i] = Vnode.normalize(input[i], store)
	//=======
	// for (var i = 0; i < input.length; i++) {
	// 	children[i] = Vnode.normalize(input[i])
	//>>>>>>>
	}
	return children
}

module.exports = Vnode

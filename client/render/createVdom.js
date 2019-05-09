"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")

module.exports = function(_vnodes) {

	var routeService = coreRouter(window)

	var nameSpace = {
		svg: "http://www.w3.org/2000/svg",
		math: "http://www.w3.org/1998/Math/MathML"
	}

	var redraw
	function setRedraw(callback) {return redraw = callback}

	function getNameSpace(vnode) {
		return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
	}

	//sanity check to discourage people from doing `vnode.state = ...`
	function checkState(vnode, original) {
		if (vnode.state !== original) throw new Error("`vnode.state` must not be modified")
	}
	
	//<<<<<<< Modified: Added setStore and hash functions
	function setStore(children, store){
		for(var i = 0; i < children.length; i++){
			if(!children[i]) continue
			children[i].store = store
		}
	}

	function hash(str) {
		var hash = 5381, i = str.length;
		while(i) {
			hash = (hash * 33) ^ str.charCodeAt(--i)
		}
		return hash >>> 0
	}
	//=======
	//>>>>>>>

	//Note: the hook is passed as the `this` argument to allow proxying the
	//arguments without requiring a full array allocation to do so. It also
	//takes advantage of the fact the current `vnode` is the first argument in
	//all lifecycle methods.
	function callHook(vnode) {
		var original = vnode.state
		try {
			return this.apply(original, arguments)
		} finally {
			checkState(vnode, original)
		}
	}

	//create
	function createNodes(vnodes, start, end, hooks, ns) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				createNode(vnode, hooks)
			}
		}
	}
	function createNode(vnode, hooks, ns) {
		var tag = vnode.tag
		if (typeof tag === "string") {
			vnode.state = {}
			if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
			switch (tag) {
				case "#": createText(vnode); break
				case "<": createHTML(vnode, ns); break
				case "[": createFragment(vnode, hooks, ns); break
				default: createElement(vnode, hooks, ns)
			}
		}
		else createComponent(vnode, hooks, ns)
	}
	function createText(vnode) {
		console.log('createText')
	}
	var possibleParents = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}
	function createHTML(vnode, ns) {
		console.log('')
	}
	function createFragment(vnode, hooks, ns) {
		console.log('createFragment')
		if (vnode.children != null) {
			var children = vnode.children
			//<<<<<<< Modified: Added store to vnode
			setStore(children, vnode.store)
			//=======
			//>>>>>>>createHTML
			createNodes(children, 0, children.length, hooks, ns)
		}
	}
	function createElement(vnode, hooks, ns) {
		console.log('createElement')
		var tag = vnode.tag
		var attrs = vnode.attrs
		var is = attrs && attrs.is

		ns = getNameSpace(vnode) || ns

		if (attrs != null) {
			setAttrs(vnode, attrs, ns)
		}

		if (attrs != null && attrs.contenteditable != null) {
			setContentEditable(vnode)
		}
		else {
			if (vnode.text != null) {
				if (vnode.text !== "") console.log('Text')
				//<<<<<<< Modified: Added store to vnode
				else vnode.children = [Vnode("#", undefined, undefined, vnode.store, vnode.text, undefined, undefined)]
				//=======
				// else vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)]
				//>>>>>>>
			}
			if (vnode.children != null) {
				var children = vnode.children
				//<<<<<<< Modified: Added store to vnode
				setStore(children, vnode.store)
				//=======
				//>>>>>>>
				createNodes(children, 0, children.length, hooks, ns)
				if (vnode.tag === "select" && attrs != null) setLateSelectAttrs(vnode, attrs)
			}
		}
	}
	function initComponent(vnode, hooks) {
		console.log('initComponent')
		var sentinel
		if (typeof vnode.tag.view === "function") {
			vnode.state = Object.create(vnode.tag)
			sentinel = vnode.state.view
			if (sentinel.$$reentrantLock$$ != null) return
			sentinel.$$reentrantLock$$ = true
		} else {
			vnode.state = void 0
			sentinel = vnode.tag
			if (sentinel.$$reentrantLock$$ != null) return
			sentinel.$$reentrantLock$$ = true
			vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode)
		}
		initLifecycle(vnode.state, vnode, hooks)
		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
		//<<<<<<< Modified: Added store to vnode
		vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode), vnode.store)
		//=======
		// vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode))
		//>>>>>>>
		if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
		sentinel.$$reentrantLock$$ = null
	}
	function createComponent(vnode, hooks, ns) {
		console.log('createComponent')
		initComponent(vnode, hooks)
		if (vnode.instance != null) {
			createNode(vnode.instance, hooks, ns)
		}
	}


	function setContentEditable(vnode) {
		console.log('setContentEditable')
		var children = vnode.children
		if (children != null && children.length === 1 && children[0].tag === "<") {
			var content = children[0].children
		}
		else if (vnode.text != null || children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted")
	}

	

	//attrs
	function setAttrs(vnode, attrs, ns) {
		console.log('setAttrs')
		for (var key in attrs) {
			setAttr(vnode, key, null, attrs[key], ns)
		}
	}
	function setAttr(vnode, key, old, value, ns) {
		console.log('setAttr')
	}
	function setLateSelectAttrs(vnode, attrs) {
		console.log('setLateSelectAttrs')
		if ("value" in attrs) {}
		if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, undefined)
	}
	function isLifecycleMethod(attr) {
		//<<<<<<< Modified: Added store to vnode
		return attr === "oninit" || attr === "fetch" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
		//=======
		// return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
		//>>>>>>>
	}

	//style
	var uppercaseRegex = /[A-Z]/g
	function toLowerCase(capital) { return "-" + capital.toLowerCase() }
	function normalizeKey(key) {
		return key[0] === "-" && key[1] === "-" ? key :
			key === "cssFloat" ? "float" :
				key.replace(uppercaseRegex, toLowerCase)
	}


	//lifecycle
	function initLifecycle(source, vnode, hooks) {
		if (typeof source.oninit === "function") callHook.call(source.oninit, vnode)
		//<<<<<<< Modified: Cache state for fetch function
		if (typeof source.fetch === "function"){

			var attrs = Object.assign({}, vnode.attrs)
			attrs.hash = undefined
			attrs.history = undefined
			attrs = JSON.stringify(attrs)
			var state = JSON.stringify(vnode.state)
		    var func = source.fetch.toString()
		    var func_hash = func.replace(/\s/g, '').replace(/\w|\d/g, '0')
		    var key = hash(attrs + state + func_hash)
		    var cache = vnode.store[key]
		    var strategy = vnode.state.cache
		    var hydrate = vnode.state.hydrate

		    // console.log(key, func_hash)

		    var shouldFetch = true

		    if(!cache) cache = {}
		    if(!cache.createdAt) cache.createdAt = Date.now()
		    if(!cache.path) cache.path = routeService.buildDataPath()
		    if(strategy === false) cache.expiresAt = 0
		    if(strategy === true || strategy === null || strategy === undefined) cache.expiresAt = Infinity
		    if(typeof strategy === 'number') cache.expiresAt = cache.createdAt + strategy
		    if(typeof strategy === 'string' || strategy instanceof Date) cache.expiresAt = new Date(strategy).getTime()


		    if(typeof cache.state === 'string' && hydrate !== false){
	    		console.log('Build Cache')
	    		try{
	    			cache
	    			cache.state = JSON.parse(cache.state)
	    			shouldFetch = false
	    		}
	    		catch(e){
	    			console.log(e)
	    		}
	    	}
		    else if(cache.state && Date.now() < cache.expiresAt){
		    	console.log('Use Cache')
	    		try{
	    			cache.state = JSON.parse(JSON.stringify(cache.state))
	    			shouldFetch = false
	    		}
	    		catch(e){
	    			console.log(e)
	    		}
		    }
		    else if(cache.state){
		    	console.log('Expire Cache')
		    	delete vnode.store[key]
		    }

		    if(shouldFetch){
		    	console.log('Fetch and Cache')
		    	callHook.call(source.fetch, vnode)
		    }
		    else{
		    	console.log('Applying Cache')
		    	Object.assign(vnode.state, cache.state)
		    }
		    cache.state = vnode.state
		    vnode.store[key] = cache
		    if(!vnode.store[cache.path]) vnode.store[cache.path] = {}
		    vnode.store[cache.path][key] = cache.expiresAt

		}
		//=======
		//>>>>>>>
		if (typeof source.oncreate === "function") hooks.push(callHook.bind(source.oncreate, vnode))
	}

	function render(vnodes) {
		var hooks = []

		//<<<<<<< Modified: Added store to vnode
		var children = Array.isArray(vnodes) ? vnodes : [vnodes]
		vnodes = Vnode.normalizeChildren(children, children[0].store)
		//=======
		// vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes])
		//>>>>>>>
		createNodes(vnodes, 0, vnodes.length, hooks)
		// for (var i = 0; i < hooks.length; i++) hooks[i]()
		return vnodes
	}

	return render(_vnodes)
}

'use strict'

function hash(str) {
	var hash = 5381, i = str.length;
	while(i) {
		hash = (hash * 33) ^ str.charCodeAt(--i)
	}
	return hash >>> 0
}

module.exports = function(store, state, attrs){

	var attrs = Object.assign({}, vnode.attrs)
	attrs.hash = undefined
	attrs.history = undefined
	var _attrs = JSON.stringify(attrs)
	var _state = JSON.stringify(state)
    var func = source.fetch.toString()
    var key = hash(attrs + state + func)
    var cache = vnode.store[key]
    var strategy = vnode.state.cache
    var hydrate = vnode.state.hydrate

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
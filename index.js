"use strict"
const path 						= require('path')
const m 						= require('./server')
const server 					= require('./build/server')
const resolveFile 				= require('./build/resolveFile')
const generateStaticPages 		= require('./build/static')


function getStack(){

	var origPrepareStackTrace = Error.prepareStackTrace

	Error.prepareStackTrace = function (_, stack) { return stack }
    	
	var error = new Error()

	var stack = error.stack

    Error.prepareStackTrace = origPrepareStackTrace
    
    return stack
    
}


m.init = function(entry, options){

	entry = resolveFile(entry, getStack())

	return server(entry, options)	
}

m.static = function(entry, map, options){

	entry = resolveFile(entry, getStack())

	generateStaticPages(entry, map, options)
}

module.exports = m
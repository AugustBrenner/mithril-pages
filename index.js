"use strict"
const path 						= require('path')
const m 						= require('./server')
const server 					= require('./build/server')
const resolveFile 				= require('./build/resolveFile')


function getStack(){

	var origPrepareStackTrace = Error.prepareStackTrace

	Error.prepareStackTrace = function (_, stack) { return stack }
    	
	var error = new Error()

	var stack = error.stack

    Error.prepareStackTrace = origPrepareStackTrace
    
    return stack
    
}


m.init = function(entry, options){

	var caller = resolveFile(getStack())

	return server(entry, caller, options)	
}

module.exports = m
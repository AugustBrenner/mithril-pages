var path 				= require('path')
var fs 		 			= require('fs')

function getCallerFile(stack) {

    var currentfile = stack.shift().getFileName()

    var callerfile

    while (stack.length) {
        
        callerfile = stack.shift().getFileName()

        if(currentfile !== callerfile) return callerfile
    }
}




module.exports = getCallerFile
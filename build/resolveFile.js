var path 				= require('path')
var fs 		 			= require('fs')

function getCallerFile(entry, stack) {

	if(path.isAbsolute(entry)) return entry

    var currentfile = stack.shift().getFileName()

    var callerfile

    while (stack.length) {
        
        callerfile = stack.shift().getFileName()

        if(currentfile !== callerfile) return path.resolve(callerfile, '..', entry)
    }
}




module.exports = getCallerFile
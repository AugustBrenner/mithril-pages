var path 				= require('path')
var fs 		 			= require('fs')

function getCallerFile() {

	var origPrepareStackTrace = Error.prepareStackTrace

    try {

    	Error.prepareStackTrace = function (_, stack) { return stack }
        
        var error = new Error()

        var stack = error.stack

        Error.prepareStackTrace = origPrepareStackTrace

        var currentfile = stack.shift().getFileName()

        var callerfile

        while (stack.length) {
            
            callerfile = stack.shift().getFileName()

            if(currentfile !== callerfile) return callerfile
        }
    }
    catch (err) {}
    return undefined;
}



function getRootDir(caller_dir_path){

	var path_array = caller_dir_path.split(path.sep)

	var root_dir

	while(path_array.length > 0){

		var current_dir = path_array.join(path.sep)

		var files_in_dir = fs.readdirSync(current_dir)

		if(files_in_dir.indexOf('package.json') > -1 || files_in_dir.indexOf('node_modules') > -1){

			root_dir = current_dir

			break
		}

		path_array.pop()
	}

	if(!root_dir) throw 'Root directory not found.'

	return root_dir

}



module.exports = function(pathname, options){

	return Promise.resolve().then(function(){

		if(path.isAbsolute(pathname)) return pathname

		var caller_dir_path = path.dirname(getCallerFile())

		return {
			filepath: path.resolve(caller_dir_path, pathname),
			dirpath: caller_dir_path,
			options: options,
		}

	})
}
const esprima = require('esprima')
const escodegen = require('escodegen')
const utils = require('loader-utils')

function match(expressions){}

function traverse(node, func) {
    if(func(node)) return;//1
    for (var key in node) { //2
        if (node.hasOwnProperty(key)) { //3
            var child = node[key];
            if (typeof child === 'object' && child !== null) { //4

                if (Array.isArray(child)) {
                    child.forEach(function(node) { //5
                        traverse(node, func);
                    });
                } else {
                    traverse(child, func); //6
                }
            }
        }
    }
}

function tokenizeExpressionStatementOrCallExpression(node){

	let tokens

	traverse(node, function(node) {

		var members

		if(node.type === 'CallExpression') members = node.callee

		else if(node.type === 'ExpressionStatement') members = node.expression

		else return

		tokens = tokenizeMemberExpression(members)
	})

	return tokens

}


function matchCallExpressions(node, caller_name){

	let calls = []

	traverse(node, function(node) {

		if(node.type === 'CallExpression' && (node.callee.name || node.callee.property)){

			if(!node.callee.name && !node.callee.property) console.log(node.callee)

			const name = node.callee.name || node.callee.property.name

			if(name === caller_name){
				tokens = tokenizeMemberExpression(node.callee)

				calls.push({
					tokens: tokens,
					call: node,
				})
			}

			return true
		}

	})

	return calls
}



function tokenizeMemberExpression(node){

	const tokens = []

	traverse(node, function(node){
		if(node.type === 'Identifier'){
			tokens.push(node.name)
		}
		else if(node.type === 'Literal'){
			tokens.push(node.value)
		}
	})

	return tokens
}



module.exports = function(source) {

	// console.time('timer')

	try{


		this.cacheable && this.cacheable()

		const options = utils.getOptions(this)
		


		const match_ast = esprima.parse(options.match)

		var match_tokens = tokenizeExpressionStatementOrCallExpression(match_ast)

		var quick_check_regex = new RegExp(match_tokens[match_tokens.length - 1])

		if(!quick_check_regex.test(source)){
			// console.timeEnd('timer')
			return this.callback(null, source)
		}
		
		var match_string = match_tokens.join('.')




		const ast = esprima.parse(source, {range: true})

		const matched_calls = matchCallExpressions(ast, match_tokens[match_tokens.length - 1])
			.filter(match => {
				return match.tokens.join('.') === match_string
			})
			.map(match => match.call)



		let offset = 0
		matched_calls.forEach(call => {
			const replacement = options.replacement(
				escodegen.generate(call), 
				call.arguments.map(escodegen.generate),
				this.rootContext,
				this.resourcePath
			)

			let start = call.range[0]
			let end = call.range[1]


			start += offset
			end += offset

			offset = offset + replacement.length - (end - start)

			source = source.substring(0, start) + replacement + source.substring(end)
			
		})
  

	}catch(e){
		console.log(e)
	}
	// console.timeEnd('timer')
	this.callback(null, source)
}
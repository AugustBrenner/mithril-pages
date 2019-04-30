const path = require('path')
const nodeExternals = require('webpack-node-externals')
const StringReplacePlugin = require("string-replace-webpack-plugin")

module.exports = function(pathname, dirname, production){
	
	return {
		mode: production ? 'production' : 'development',
		// entry: path.resolve(__dirname, './bundle-bridge.js'),
		entry: path.resolve(__dirname, './bundle-bridge-server.js'),
		output: {
			path: pathname,
	        filename: 'bundle_server.js',
	        library: 'app',
	        libraryTarget: 'umd'
	    },
	    target: 'node',
   		externals: [nodeExternals()],
	    node: {
			fs: 'empty',
			net: 'empty',
			tls: 'empty',
			'crypto': 'empty'
		},
		resolve: {
			alias: {
				'mithril-pages': path.resolve(__dirname, '../server/index.js')
			}
		},
		module: {
			rules: [
		        { 
		            include: [
          				path.resolve(__dirname, 'bundle-bridge-server.js')
          			],
		            loader: StringReplacePlugin.replace({
		                replacements: [
		                    {
		                        pattern: /PLACEHOLDER_FOR_ENTRY/g,
		                        replacement: function (match, p1, offset, string) {
		                            return pathname
		                        }
		                    }
		                ]
		            })
		        }
			]
		},
	   	plugins: [
	   		new StringReplacePlugin(),
		],
	    devtool: 'sourcemap',
	}

}


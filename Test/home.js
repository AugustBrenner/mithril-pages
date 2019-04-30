const m 		= require('mithril-pages')

var Home = {

	oninit: function(vnode) {		

		return new Promise((resolve, reject) => {

			setTimeout(function(){
				resolve()
			}, 400)
			
		})
		.then(function(){

			vnode.state.greetings = [{greeting: 'Hello!!!'}]

			m.redraw()
		})
	    	

	},

	oncreate: function(vnode){
		console.log('init')
		console.time('timer')
		m.redraw()
		console.timeEnd('timer')
	},
 
	view: function(vnode) {
		return [
			m('head', [
				m.styles,
				m('title', 'Home'),
			]),
			m('body', [
				m('a', {href:'/page2', oncreate: m.route.link}, 'Page 2'),
				m('pre', JSON.stringify(vnode.state.greetings, null, 4)),
				// Array.apply(null, {length: 99999}).map(x => {
				// 	return m('p', 'hello')
				// }),
				m.scripts
			]),
		]
	}
}

module.exports = Home
const m 		= require('mithril-pages')

var Async = {
	
	fetch: function(vnode){

		return new Promise((resolve, reject) => {

			setTimeout(function(){
				vnode.state.STATE6 = 'STATE6'
				resolve()
			}, 400)
			
		})
		.then(function(){

			vnode.state.gre = [{gre: 'HYE!'}]

			// vnode.state.cache = new Date(Date.now() + 5000)

			m.redraw()
		})
	},

	oninit: function(vnode) {		
		vnode.state.STATE5 = 'STATE5'

		vnode.state.counter = 0

		vnode.state.increment = function(){
			vnode.state.counter++
		}

		// vnode.state.cache = false
		// vnode.state.cache = 5000
		// vnode.state.hydrate = false

	},


	oncreate: function(vnode){
		// console.log('init')
		// console.time('timer')
		// m.redraw()
		// console.timeEnd('timer')
	},
 
	view: function(vnode) {
		// console.log('home', vnode.store)
		return m('div', [
			m('a', {href:'/page2', oncreate: m.route.link}, 'Page 2'),
			m('pre', JSON.stringify(vnode.state.gre, null, 4)),
			m('pre', vnode.state.counter),
			m('div', 'TEST'),
			m('div', 'TEST'),
			m('div', 'TEST'),
			m('button', {
				onclick: function(){
					vnode.state.increment()
				}
			}, '+1'),
			// Array.apply(null, {length: 99999}).map(x => {
			// 	return m('p', 'hello')
			// }),
		])
	}
}

module.exports = Async
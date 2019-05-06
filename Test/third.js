const m 		= require('mithril-pages')
const Comp 		= require('./component2')
const Async 	= m.lazy.require('./asynccomponent')

var Page3 = {

	oninit: function(vnode) {		
		vnode.state.STATE1 = 'STATE1'

		vnode.state.counter = 0

		vnode.state.increment = function(){
			vnode.state.counter++
		}

		// vnode.state.cache = false
		// vnode.state.cache = 5000
		// vnode.state.hydrate = false

	},

	fetch: function(vnode){

		return new Promise((resolve, reject) => {

			setTimeout(function(){
				vnode.state.STATE2 = 'STATE2'
				resolve()
			}, 400)
			
		})
		.then(function(){

			vnode.state.greetings = [{greeting: 'Hello!'}]

			// vnode.state.cache = new Date(Date.now() + 5000)

			m.redraw()
		})
	},

	oncreate: function(vnode){
		// console.log('init')
		// console.time('timer')
		// m.redraw()
		// console.timeEnd('timer')
	},
 
	view: function(vnode) {
		console.log('page3', vnode.attrs)
		return [
			m('head', [
				m.styles,
				m('title', 'Page 3'),
			]),
			m('body', [
				m('a', {href:'/page2', oncreate: m.route.link}, 'Page 2'),
				m('pre', JSON.stringify(vnode.state.greetings, null, 4)),
				m('pre', vnode.state.counter),
				// m('div', 'HELLO'),
				// m('div', 'HELLO'),
				// m('div', 'HELLO'),
				m('button', {
					onclick: function(){
						vnode.state.increment()
					}
				}, '+1'),
				m(Comp, {key: 'COMP'}),
				m(Async, {key: 'ASYNC'}),
				// Array.apply(null, {length: 99999}).map(x => {
				// 	return m('p', 'hello')
				// }),
				m.scripts
			]),
		]
	}
}

module.exports = Page3
const m 		= require('mithril-pages')

var Home = {

	fetch: function(vnode){

		vnode.state.greetings = []

		return Promise.all([
			m.request('https://jsonplaceholder.typicode.com/todos/1')
			.then(function(response){

				vnode.state.greetings.push(response)

				// vnode.state.cache = new Date(Date.now() + 5000)

			}),

			m.jsonp('https://json2jsonp.com/?url=https://jsonplaceholder.typicode.com/todos/1')
			.then(function(response){
				vnode.state.greetings.push(response)
			})
		])
	},


	oninit: function(vnode) {

		console.time('timer')

		vnode.state.STATE1 = 'STATE1'

		vnode.state.counter = 0

		vnode.state.increment = function(){
			vnode.state.counter++
		}

		// vnode.state.cache = false
		// vnode.state.cache = 10000
		// vnode.state.hydrate = false

		console.log('Target: ', m.target)

	},


	oncreate: function(vnode){
		// console.log('init')
		// console.time('timer')
		// m.redraw()
		console.timeEnd('timer')
	},
 
	view: function(vnode) {
		// console.log('home', vnode.store)
		return [
			m('head', [
				m.styles,
				m('title', 'Home'),
			]),
			m('body', [
				m('a', {href:'/page2', oncreate: m.route.link({preload: false, prefetch: false})}, 'Page 2'),
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
				// Array.apply(null, {length: 99999}).map(x => {
				// 	return m('p', 'hello')
				// }),
				m.scripts
			]),
		]
	}
}

module.exports = Home
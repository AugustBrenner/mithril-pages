const m 		= require('mithril-pages')
const Home 		= m.lazy.require('./home.js', {
	view: function(vnode){
		return [
			m('head'),
			m('body', {style: 'height: 100%; width: 100%; background-color: green;'})
		]
	}
}, {
	load: 'req'
})
const Page3 	= m.lazy.require('./third.js', null, {load:'req'})

m.lazy.load('pre')
// m.lazy.fetch('pre')

// require('./like.svg')
// require('./styles.css')


var component = {
	view: function(vnode){
		// console.log('component', vnode.store)
		return m('div', 'Hello!')
	}
}
// console.log(m.scripts)

var Page2 = {

	oninit: function(vnode){
		vnode.store.hello = 'world'
		vnode.state.STATE = 'STATE1'
	},
		
	view: function(vnode) {
		// console.log('page', vnode.store)
		// return m('div', m.scripts)
		return [
			m('head', [
				m('title', 'Page 2'),
				m.styles,
			]),
			m('body', [
				m('a', {href:'/', oncreate: m.route.link({preload: true, prefetch: true})}, 'Home', 'Away', 'from', m({view: function(vnode){return m('div','HOME')}})),
				m('a', {href:'/page3?hello=hello#hash', oncreate: m.route.link({preload: false, prefetch: false})}, 'Page 3'),
				m('svg', m('use', {'xlink:href': '#icon-like'})),
				m('pre', {key: 'pre'}, JSON.stringify(vnode.attrs, null, 4)),
				m(component, {HEllo: 'World'}),
				m.svgs,
				m.scripts,
			]),
		]
	}
}






// Routes

const router 	= {

	'/'			            : Home,

	'/page2'              	: Page2,
	'/page2/:param2...' 	: Page2,
	'/page3'				: Page3,
	'/page3/:hola...'		: Page3,

}

// m.route(document.getElementById('root'), '/', router)

module.exports = router

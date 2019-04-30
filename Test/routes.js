const m 		= require('mithril-pages')
const Home 		= require('./home.js')

// require('./like.svg')
// require('./styles.css')


var component = {
	view: function(){
		return m('div', 'Hello!')
	}
}


var Page2 = {

	oninit: function(vnode){

	},
		
	view: function(vnode) {
		return [
			m('head', [
				m('title', 'Page 2'),
				m.styles,
			]),
			m('body', [
				m('a', {href:'/', oncreate: m.route.link}, 'Home'),
				m('svg', m('use', {'xlink:href': '#icon-like'})),
				m('pre', JSON.stringify(vnode.attrs, null, 4)),
				m(component, {HEllo: 'World'}),
				m.svgs,
				m.scripts,
			]),
		]
	}
}






// Routes

const router 	= {

	'/'			              : Home,

	'/page2'              	: Page2,
	'/page2/:param2...' 	: Page2,

}

// m.route(document.getElementById('root'), '/', router)

module.exports = router

'use strict'

var m = require('../index.js')


module.exports = {
    view: function(vnode) {
        return m('h1', vnode.attrs.text)
    }
}

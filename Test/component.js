'use strict'

var c = require('../index.js')


module.exports = {
    view: function(vnode) {
        return c('h1', vnode.attrs.text)
    }
}

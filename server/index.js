"use strict"

const hyperscript = require("../client/hyperscript")
const m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment

m.redraw = function(){}

m.styles = '__mithril_pages_styles__'
m.scripts = '__mithril_pages_scripts__'

m.route = function(){}

module.exports = m
"use strict"

var PromisePolyfill = require("../mithril/promise/promise")
module.exports = require("./request/request")(PromisePolyfill)

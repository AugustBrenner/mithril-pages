
const express 			= require('express')
const compression 		= require('compression')

const server = express()

server.use(compression())

const pages = require('./index.js')
console.log(process.env.NODE_ENV)
const app = pages.init('./Test/routes.js', {production: process.env.NODE_ENV === 'production'})

server.use(app)


server.listen(3000, function () {
  console.log('Example app listening on port 3000!\n')
})

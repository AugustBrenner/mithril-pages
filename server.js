// var http = require('http')

// var pages = require('./index.js')

// var app = pages.init('./Test/routes.js')

// http.createServer(function (req, res) {

// 	pages.render(req.url, app).then(function(page){


// 		res.writeHead(200, {'Content-Type': 'text/html'})
// 		res.end(page)
// 	})


// }).listen(3000)

const express = require('express')

const server = express()

const pages = require('./index.js')

const app = pages.init('./Test/routes.js')

server.use(app)


server.listen(3000, function () {
  console.log('Example app listening on port 3000!\n')
})

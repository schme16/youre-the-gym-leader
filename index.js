var express = require('express'),
	app = express(),
	//db = require(__dirname + '/db-connect.js'),
	server = require('http').Server(app),
	socketIO = require('socket.io')(server)
	

app.use(require('cors')())
app.use(require('compression')())

app.use(express.static(`${__dirname}/public`))
require('./apis/api.js')(socketIO)


server.listen(process.env.PORT || 8383)
 

 
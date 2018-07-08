module.exports = function (socketIO) {

	socketIO.on('reconnection', function (socket) {
		
	})

	socketIO.on('connection', function (socket) {
		console.log(socket.id)
		//Remove a booking from a date
		socket.on('api-here', function (data) {

		})

	})


}
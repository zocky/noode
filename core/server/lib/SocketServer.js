var SessionServer = require('./SessionServer.js');

exports.start = function( staticServer , opt) {

	exports.server = require('socket.io').listen(staticServer);
	
	exports.server.sockets.on('connection', function(socket) {
		new SessionServer( socket ,opt);
	});
	exports.server.configure(function() {
		console.log('configuring io');
		for (var i in opt.io) exports.server.set(i,opt.io[i]);
	});
	return this;
}

// KULTURA Meta search
// (c) 2011 user:zocky @ wiki.ljudmila.org
// GPL 3.0 applies
//
// meta search collater
// index.js  

// local module variables

var config = require('./lib/config.js');
var myConfig;
var staticServer;
var sqlServer;

// module interface
exports.start = function( opt ) {
	myConfig = config.load( opt );
	staticServer = require('./lib/StaticServer.js').start( myConfig );
	sqlServer = require('./lib/SocketServer.js').start( staticServer.server , myConfig );
	staticServer.server.listen(opt.port||3000);
}

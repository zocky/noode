var utils =require('./utils.js');

exports.start = function(staticServer, conf) {
	this.io = require('socket.io').listen(staticServer);
	  var servers = {};
	  var clientConf = {};
	  clientConf.servers = {};
	  for (var i in conf.servers) {
  	  console.log('Loading',i);
	    servers[i] = require('./SessionServers/'+(conf.servers[i].file||i)+'.js').setup(conf.servers[i],i);
	    clientConf.servers[i] = {
	      name: i,
	      login: conf.servers[i].login,
	      info: conf.servers[i].info
	    }
	  }

	this.io.sockets.on('connection', function(socket) {
	  var sessions = {};

	  socket.on('login',function(args,cb) {
      console.log('login',args, cb);
      var srv = args.conid.replace(/\W.*$/,'');
	    var server = servers[srv];
	    if (!server) return cb(utils.ERR('no such server '+srv));
	    server.login(args,function(error,s){
  		  if(s) sessions[s.conid] = s;
  		  if (error) return cb(error);
  		  socket.set('session',s.conid, function() {
    		  cb(null,{conid:s.conid});
    		})
  		});
  	});
  	
  	socket.on('disconnect', function () {
		  socket.get('session', function(error,data) {
		    if (error) return;
		    sessions[data] && sessions[data].logout();
  		})
  	});
  	
	  socket.on('logout',function(args,cb) {
  		var s = sessions[args.conid];
  		if (!s) return cb(utils.ERR('no such session'));
  		s.logout(function(error,data) {
  		  if(!error) delete sessions[s.conid];
  		  cb(error,data);
  		});
  	})
  	
	  socket.on('request',function(args,cb) {
	    console.log('request',args.conid);
  		var s = sessions[args.conid];
  		if (!s) return cb(utils.ERR('no such session'));
  		s.request(args.action,args,cb);
  	})
  	
	  socket.emit('welcome',clientConf);
	});
	var me = this;
	this.io.configure(function() {
		for (var i in conf.io) me.io.set(i,conf.io[i]);
	});
	return this;
}

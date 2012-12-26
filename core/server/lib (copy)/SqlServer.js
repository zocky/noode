var time = require('microtime');

function SessionServer( socket, opt, cb ) {
	this.client = socket;
  this.pg = new pgClient( );
  
	this.loggedin = false;
	var me = this;

	var guid = function() {
	  return Number(String(Math.random()).substr(2)).toString(36) + Number(String(Math.random()).substr(2)).toString(36)
	}
	var respond = function(id,error,data) {
    me.socket.send('respond', {
      id: guid(),
      reqid: id,
      error: error,
      data: null
    })
	}
	
	this.socket.on('login', function(msg) {
	  msg.host = 'localhost'|| msg.host;
	  msg.port = 5432 || msg.port;
	  
	  if (me.loggedin) return respond(msg.id,'You are already logged in.',null);
	  if (!msg.database || !msg.username) return respond(msg.id,'Incomplete connection information.',null);
	  
    var constring = 'postgres://'
    + msg.username 
    + (msg.password ? ':' + msg.password : '')
    + '@' + msg.host
    + ':' + msg.port
    + '/' + msg.database;
    
    this.pg.connect(constring, function(error, client) {
      respond(msg.id,error, client && 'You are now logged in.' || null);
      if(error) return;
      me.loggedin = true;
   	  me.database = msg.database;
	    me.username = msg.username;
	    me.host = msg.host;
	    me.port = msg.port;
    });
	})
	this.socket.on('logout', function(msg) {
    if(!me.loggedin) return respond(msg.id,error, client && 'You are not logged in.' || null);
		me.pg.on('drain',function() {
		  me.pg.end.bind(me.pg);
		  respond(msg.id,null,'You are now logged out');
		  me.loggedin = false;
		}
	})
	this.socket.on('query_sql', function(msg) {
	  me.client(msg.query,msg.args||[], function(error, data) { 
	    respond(msg.id,error,data);
	  });
	});
	this.socket.on('get_class', function(msg) {
	//TODO: get class def from db, convert to json
	});
	this.socket.on('save_class', function(msg) {
	//TODO: convert json to array, insert into #prop#replace
	});
	this.socket.on('disconnect', function() {
		me.pg.on('drain',function() {
		  me.pg.end.bind(me.pg);
		}
	});
	
	this.emit('welcome', {protocol:'kultura',version:'0.1prealpha'});
}

module.exports = Search;

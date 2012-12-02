var time = require('microtime');
var PG = require('pg');

function SessionServer(socket,opt) {
	this.socket = socket;
  
	this.loggedin = false;
	var me = this;

	var guid = function() {
	  return Number(String(Math.random()).substr(2)).toString(36) + Number(String(Math.random()).substr(2)).toString(36)
	}
	var respond = function(id,error,data) {
    me.socket.emit('respond', {
      id: guid(),
      reqid: id,
      error: error,
      data: data
    })
	}
	
	this.socket.on('login', function(msg) {
	  console.log('login',msg);
	  msg.host = msg.host || opt.db.host || 'localhost';
	  msg.port = msg.port || opt.db.port || 5432;
	  msg.database =  msg.database || opt.db.database;
	  
	  if (me.loggedin) return respond(msg.id,'You are already logged in.',null);
	  if (!msg.database || !msg.user) return respond(msg.id,'Incomplete connection information.',null);
	  
    var constring = 'postgres://'
    + msg.user 
    + (msg.password ? ':' + msg.password : '')
    + '@' + msg.host
    + ':' + msg.port
    + '/' + msg.database;
    
    me.pgClient = new PG.Client(msg);
    
    if (me.pgClient) {
      me.pgClient.connect(function(error, pgClient) {
        if (error) return respond(msg.id,error,{});
        me.pgClient.query('select current_database() as database, current_schema as schema, current_user as user', function(error, data){
          if(error) respond(msg.id, error, data);

          me.pgClient = pgClient;
          me.loggedin = true;
       	  me.database = msg.database;
	        me.user = msg.user;
	        me.host = msg.host;
	        me.port = msg.port;
	        respond(msg.id,error,data.rows[0]);
        });
      });
    }
	})
	this.socket.on('log_out', function(msg) {
	  console.log('logging out');
    if(!me.loggedin) return respond(msg.id,'You are not logged in.',null);
	  respond(msg.id,null,'You are now logged out');
	  me.pgClient = null;
	  me.loggedin = false;
		me.pgClient.on('drain',function() {
		  me.pgClient.end.bind(me.pgClient);
		});
	})
	this.socket.on('query_sql', function(msg) {
    if(!me.loggedin) return respond(msg.id,'You are not logged in.',null);
	  me.pgClient.query(msg.query,msg.args||[], function(error, data) { 
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
    if(!me.loggedin) return;
		me.pgClient.on('drain',function() {
		  me.pgClient.end.bind(me.pgClient);
		});
	});
	this.socket.emit('welcome', {protocol:'noode',version:'0.1prealpha'});
}

module.exports = SessionServer;

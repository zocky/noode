Noode.Client = function(socket) {
  this.socket = socket;
  this.events = {};
},
Noode.Client.wake = function(state) {
  var c = new Noode.Client();
  for (var id in state.connections) Noode.Connection.wake(this,state.connections[id]);
}

Noode.Client.prototype = {
  constructor: Noode.Client,
  sleep: function() {
    var ret = {};
    ret.connections = {};
    for (var id in this.connections) ret.connections[id] = this.connections[id].sleep();
    return ret;    
  }
  request: function(c,cmd,args,cb) {
    if(!c.connected) {
      c.trigger('error','request',utils.ERR('not connected yet'));
      return;
    }
    args.conid = c.conid;
    args.action = cmd;
    
    c.trigger('request');
    this.socket.emit('request', args, function(error,data) {
      if (error) {
        c.trigger('error','request',cmd, error);
      } else {
        c.connected = false;
        delete c.data;
        c.trigger('requested',cmd,data);
      }
      cb && cb(error,data);
    })
  },
  connect: function(c,password,cb) {
    if(c.connected) {
      c.trigger('error','connect',utils.ERR('already connected'));
      return;
    }

    c.trigger('connect');
    this.socket.emit('login', {conid: c.conid, password: password }, function(error,data) {
      if (error) {
        c.trigger('error','connect',error);
      } else {
        c.data = data;
        c.connected = true;
        c.trigger('connected');
      }
      cb && cb(error,data);
    })
  },
  disconnect: function(c,cb) {
    if(!c.connected) {
      c.trigger('error','remove',utils.ERR('not connected yet'));
      return;
    }
    
    c.trigger('disconnect');
    this.socket.emit('logout', {}, function(error,data) {
      if (error) {
        c.trigger('error','disconnect',error);
      } else {
        c.connected = false;
        delete c.data;
        c.trigger('disconnected');
      }
      cb && cb(error,data);
    })
  },
  removeConnection: function(c) {
    if(c.connected) {
      c.trigger('error','remove',utils.ERR('cannot remove connection while connected'));
      return;
    } 
    this.trigger('remove',c);
    c.trigger('remove');
    delete this.connections[c];
    c.trigger('removed');
    this.trigger('removed',c);
  },
  addConnection: function(conid) {
    if (this.connections[conid]) {
      c.trigger('error','add',utils.ERR('connection already exists'));
      return;
    } 
    this.connections[conid] = new Noode.Connection(conid);
    c.trigger('add');
    c.trigger('added');
  },
}


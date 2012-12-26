Noode.Client = function(socket) {
  this.socket = socket;
  this.events = {};
},
Noode.Client.prototype = {
  constructor: Noode.Client,
  connect: function(c,password,cb) {
    if(c.connected) {
      c.trigger('error','connect',utils.ERR('already connected'));
      this.trigger('error','connect',c,utils.ERR('already connected'));
      return;
    }

    this.trigger('connect',c);
    c.trigger('connect');
    this.request('login', {conid: c.conid, password: password }, function(error,data) {
      if (error) {
        c.trigger('error','connect',error);
        this.trigger('error','connect',c,error);
      } else {
        c.data = data;
        c.connected = true;
        c.trigger('connected');
        this.trigger('connected',c);
      }
      cb && cb(error,data);
    })
  },
  disconnect: function(c,cb) {
    if(!c.connected) {
      c.trigger('error','remove',utils.ERR('not connected yet'));
      this.trigger('error','remove',c,utils.ERR('not connected yet'));
      return;
    }
    
    this.trigger('disconnect',c);
    c.trigger('disconnect');
    this.request('logout', {}, function(error,data) {
      if (error) {
        c.trigger('error','disconnect',error);
        this.trigger('error','disconnect',c,error);
      } else {
        c.connected = false;
        delete c.data;
        c.trigger('disconnected');
        this.trigger('disconnected',c);
      }
      cb && cb(error,data);
    })
  },
  remove: function(c) {
    if(c.connected) {
      c.trigger('error','remove',utils.ERR('cannot remove connection while connected'));
      this.trigger('error','remove',c,utils.ERR('cannot remove connection while connected'));
      return;
    } 
    this.trigger('remove',c);
    c.trigger('remove');
    delete this.connections[c];
    c.trigger('removed');
    this.trigger('removed',c);
  },
  add: function(conid) {
    if (this.connections[conid]) {
      c.trigger('error','add',utils.ERR('connection already exists'));
      this.trigger('error','add',c,utils.ERR('connection already exists'));
      return;
    } 
    this.connections[conid] = new Noode.Connection(conid);
    this.trigger('add',c);
    c.trigger('added');
    this.trigger('added',c);
  },
}

Noode.Connection.prototype = {
  constructor:Noode.Connection,
  connect: function(password) {
    CLIENT.connect(this.conid,password);
  },
  disconnect: function(password) {
    CLIENT.disconnect(this.conid);
  },
  remove: function(password) {
    CLIENT.remove(this.conid);
  },
}



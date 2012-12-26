
Noode.Connection = function(conid) {
  this.conid = conid;
  Noode.giveEvents(this);
}

Noode.Connection.wake = function(client,state) {
  var c = client.addConnection(state.conid);
  if (state.connected) c.connect(state.password);
  for (var id in state.queries) Noode.Query.wake(state.queries[id]);
}

Noode.Connection.prototype = utils.merge({}, new Noode.Events(), {
  
  constructor:Noode.Connection,
  trigger: function() {
    this.fire(ev,arguments);
    this.client.fire('connection-'+ev,this,arguments);
  },
  sleep: function() {
    var ret = {
      conid: this.conid,
      _connected: this.connected,
      _password: this.password,
      queries: {}
    }
    for (var id in this.queries) ret.queries[id] = this.queries[id]sleep();
  },
  connect: function(password) {
    this.password = password;
    this.client.connect(this.conid,password);
  },
  disconnect: function(password) {
    this.client.disconnect(this.conid);
  },
  remove: function(password) {
    this.client.removeConnection(this.conid);
  },
  addQuery: function(q,options) {
    this.client.trigger('query-add',this,q,options);
    this.trigger('query-add',q,options);
    
    var id = utils.guid();
    var query = new Noode.Query(this,q,options);
    query.id = id;
    this.queries[id] = query;
    query.trigger('added');
    this.trigger('query-added',query);
    this.client.trigger('query-add',this,query);
  },
  removeQuery: function(q,options) {
    this.client.trigger('query-add',this,q,options);
    this.trigger('query-add',q,options);
    
    var id = utils.guid();
    var query = new Noode.Query(this,q,options);
    query.id = id;
    this.queries[id] = query;
    query.trigger('added');
    this.trigger('query-added',query);
    this.client.trigger('query-add',this,query);
  },
  execQuery: function(q,options) {
    this.client.trigger('query-add',this,q,options);
    this.trigger('query-add',q,options);
    
    var id = utils.guid();
    var query = new Noode.Query(this,q,options);
    query.id = id;
    this.queries[id] = query;
    query.trigger('added');
    this.trigger('query-added',query);
    this.client.trigger('query-add',this,query);
  },
  request: function
}



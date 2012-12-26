Noode.Query = function(connection,q,options) {
  this.connection = connection;
  this.q = q;
  this.options = options || {};
  this.events = {};
}

Noode.Query.wake = function(connection,state) {
  var query = connection.addQuery(state.q,state.options);
}

Noode.Query.prototype = {
  constructor:Noode.Query,
  trigger: function() {
    this.fire(ev,arguments);
    this.connection.fire('query-'+ev,this,arguments);
    this.connection.client.fire('query-'+ev,this,arguments);
  },
  sleep: function() {
    return {
      q: this.q,
      options: this.options,
    }
  },
  configure: function(options) {
    for (var i in options) {
      this.trigger('configure',i,options[i]);
      this.options[i]=options[i];
      this.trigger('configured',i,options[i]);
    }
  },
  execute: function(options) {
    this.connection.executeQuery(this.conid,password);
  },
  remove: function() {
    this.connection.removeQuery(this.conid);
  }
}


//var time = require('microtime');
var self = module.exports;
var utils = self.utils = require('../utils.js');

self.login = function(args,cb) {
  self.handlers.login(args,function(error,data) {
    if(!error) {
      var s = new Session(data);
      cb(null,s);
    } else {
      cb(error,null);
    }
  });
}


var Session = function(data) {
  this.conid = data.conid;
  for (var i in data) this[i] = this[i] || data[i];
}

Session.prototype = {
  request: function(action,args,cb) {
    console.log(action,args);
    var h = self.handlers.request[action];
    console.log(self.handlers);
    if(!h) return cb(utils.ERR('no such action handler: '+action,'ERROR'));
    console.log('handling '+args.action + ' on '+this.conid);
    h.call(this,args,cb);
  },
  logout: function(cb) {
    self.handlers.logout.call(this,cb);
  },
}

self.setup = function(conf,name) {
  self.conf = conf;
  self.conf.name = name;
  self._setup.forEach(function(n){n.call(self)});
  return self;
}

self._setup = [];

self.makeConid = function(args) {
  return utils.ERR('not implemented: makeConid');
}

self.handlers = {
  conid: function(args,cb) {
    var c = self.makeConid(args);
    if (typeof(c) != 'string') {
      cb(c||utils.ERR('Bad conid'));
    } else {
      cb(null,c);
    }
  },
  login: function(args,cb) {
    cb(utils.ERR('not implemented: login'));
  },
  logout: function(cb) {
    cb(utils.ERR('not implemented: logout'));
  },
  request: {
    query: function(args,cb) {
      cb(utils.ERR('not implemented: query'));
    },
    page: function(args,cb) {
      cb(utils.ERR('not implemented: page'));
    },
    count: function(args,cb) {
      cb(utils.ERR('not implemented: count'));
    },
    fields: function(args,cb) {
      cb(utils.ERR('not implemented: fields'));
    }
  }
}

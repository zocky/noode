function Client(socket) {
	this.sessions = {};
	this.socket = socket;
}

Client.prototype = {
  constuctor: Client,
	_request: function(cmd,args,cbdata,cb,ctx) {
	  ctx = ctx || this;
	  args = args || {};
	  var me = this;
	  if (cb) {
	    var fn = cbdata ? function(error,data) {
	      console.log(cmd,error,data);
        if (res.error) return cb.call(ctx,error,data);
        return cbdata.call(ctx,data);
      } : function(error,data) {
	      console.log(cmd,error,data);
        return cb.call(ctx,error,data);
	    };
	    console.log(1,cmd,args,fn)
      this.socket.emit(cmd,args,fn); 
	  } else {
	    console.log(2,cmd,args)
  	  this.socket.emit(cmd,args);
	  }
	},
	_login: function(conf,cbdata,cb,ctx) {
	  var me = this;
	  this._request('login',conf,null,function(error,data) {
	    if (error) return cb.call(ctx,error);
	    console.log('logged in',data);
	    var session = this.sessions[data.conid] = new Session(this,conf,data.conid);
      $(document).trigger('sessionconnected',[session.conid]);

	    if (!cb) return;
	    if (!error && cbdata) return cbdata.call(ctx,session);
	    return cb.call(ctx,error,session);
	  },this);
	}
}


Client.prototype.request = Client.prototype._request.overload({
  'string,object,function,function,object': 'cmd,args,cbdata,cb,ctx',
  'string,object,function,function': 'cmd,args,cbdata,cb',
  'string,object,function,object': 'cmd,args,cb,ctx',
  'string,object,function': 'cmd,args,cb',
  'string,function,object': 'cmd,cb,ctx',
  'string,function': 'cmd,cb',
  'string,object': 'cmd,args',
})
Client.prototype.login = Client.prototype._login.overload({
  'object,function,function,object': 'conf,cbdata,cb,ctx',
  'object,function,function': 'conf,cbdata,cb',
  'object,function,object': 'conf,cb,ctx',
  'object,function': 'conf,cb',
  'object': 'conf',
})


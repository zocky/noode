function Session(client,conf,conid) {
  this.client = client;
  this.conf = conf;
  this.conid = conid;
}

Session.prototype = {
	_request: function(cmd,args,cbdata,cb,ctx) {
	  args = args || {};
	  args.action = cmd;
	  args.conid = this.conid;
	  this.client._request('request',args,cbdata,cb,ctx);
	},
	_logout: function(cbdata,cb,ctx) {
	  ctx = ctx||this;
	  this._request('logout',{},function(error,data) {
	    if(!error) delete this.sessions[this.id];
	    if (!cb) return;
	    if (!cberr) return cb.call(ctx,error,data);
	    if (error) return cberr.call(ctx,error)
	    return cb.call(ctx,data);
	  },null,this);
	}
}

Session.prototype.request = Session.prototype._request.overload({
  'string,object,function,function,object': 'cmd,args,cbdata,cb,ctx',
  'string,object,function,function': 'cmd,args,cbdata,cb',
  'string,object,function,object': 'cmd,args,cb,ctx',
  'string,object,function': 'cmd,args,cb',
  'string,function,object': 'cmd,cb,ctx',
  'string,function': 'cmd,cb',
  'string,object': 'cmd,args',
})
Session.prototype.logout = Session.prototype._logout.overload({
  'function,function,object': 'cbdata,cb,ctx',
  'function,function': 'cbdata,cb',
  'function,object': 'cb,ctx',
  'function': 'cb',
  '': '',
})



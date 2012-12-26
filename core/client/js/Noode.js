function Noode() {
  var me = this;
  this.events = {};
  this.tabs = new Widget('nav_tabs',{},'#root');
  this.mainTab = this.tabs.addPane({id:'NOODE',selected:true,label:'<i class="icon-home"></i> NOODE'});
  this.console = this.mainTab.widget('content','console',{session:Client,label:'Main NOODE console'});
  
  this.console.message('Welcome to NOODE. Trying to establish connection...');
  this.socket = io.connect(location.host);
  this.socket.on('welcome',function(conf) {
    me.conf = conf;
    me.client = new Client(me,me.socket);
    me.console.message('Backend connection established. You can now log in.');
    me.prompt = me.console.prompt('login',{title:'add a connection'});
    me.init();
  });
}

Noode.prototype = {
  on: funct ion(name,cb) {
    if (!this.events[name]) this.events[name] = new $.Callbacks();
    this.events[name].add(cb);
  },
  off: function(name,cb) {
    if (!this.events[name]) return;
    this.events[name].remove(cb);
  },
  trigger: function(name,args) {
    if (!this.events[name]) return;
    this.events[name].fire(args);
  },
  init: function() {
    this.loadState();
    for (var i in this.persistent.sessions) {
      this.showConnection(i);
    }
  },
  saveState: function() {
    localStorage.NOODE = JSON.stringify(this.persistent);
    sessionStorage.NOODE = JSON.stringify(this.transient);
  },
  loadState: function() {
    try {
      this.persistent = JSON.parse(localStorage.NOODE);
    } catch (e) {
      this.persistent = {
        sessions: {},
      }
    }
    try {
      this.transient = JSON.parse(sessionStorage.NOODE);
    } catch (e) {
      this.transient = {
        sessions: {},
      }
    }
  },
  connect: function(conid) {
    me.client.login({conid:conid,password:me.persistent.sessions[conid].auth.password}, function(session) {
      session.server = args.server;
      me.trigger('connection-connected');
      me.addSessionTab(session);
    }, function(error) {
      me.trigger('connection-error');
    });
  },
  disconnect: function(conid) {
  },
  showConnection:function(conid) {
    this.console.conlet('connection',{conid:conid,title:conid, Q:this.persistent.sessions[conid]});
  },
  removeConnection:function(conid) {
  },
  newConnection:function (args) {
    var me = this;
    me.client.request('conid',args, function(conid) {
      me.persistent.sessions[conid] = utils.merge({},args);
      me.saveState();
    }, function(error) {
        me.prompt.part('message','error',error)
    });
  },
  addSessionTab:function(session) {
    var me = this;
    var tab = this.tabs.addPane({id:utils.guid(),label:session.conid,selected:true,close:true});
    tab.part('content','rsplit');
    var con = session.console = tab.widget('main','console',{session:session,clear:true});
    var bro = tab.widget('pane','browser',{session:session});
    if (me.conf.servers[session.server].info.schemas) {
      bro.part('schemas',{});
    }
    con.message('You are now logged in.');
    con.prompt('prompt_sql',{title:'add a query',content:'prompt',console:con});
  },
}

var NOODE;
$(function(){
  NOODE = new Noode();

})

utils.merge(Widget.parts,{
  nav_tabs: {
    extend: {
      addPane: function(args) {
        args.id = args.id || utils.guid();
        args.label =  args.label || args.id;
        var w = this.widget('nav_tabpane',args);
        var $t = this.part('nav_tab',args);
        return w;
      }
    }
  },
  nav_tab: {
    setup: function($this,args,me) {
      console.log('siblings',$this.siblings());
      if (args.selected || $this.siblings().length==0) $this.find('a').tab('show');
    }
  },
  nav_tabpane: {},
  browser:{
    setup: function($this,args,me) {
      me.session = args.session;
    }
  },
  schemas:{
    setup: function($this,args,me) {
      console.log('asking');
      me.session.request('list_schemas',function(error,data) {
        if (error) return console.log('error',error);
        for (var i in data.rows) me.part('schema',data.rows[i]);
      })
      $this.change(function() {
        me.part('tables',{schema:this.value});
      }).change();
    }
  },
  schema:{},
  tables: {
    setup: function($this,args,me) {
      me.session.request('list_tables',{schema:args.schema},function(error,data) {
        if (error) return console.log('error',error);
        for (var i in data.rows) me.part('table',data.rows[i]);
      })
    }
  },
  table:{}
})

var utils = {
  URIRE: /^(\w+):[/][/](?:([^@:/\s]+)(?::([^@/]+))?@)?([a-z_A-Z.-]+)(?::(\d+))?(?:[/]([^?]*))?(?:[?](\S*))?$/,
  parseURI: function(s) {
    var m = s.match(utils.URIRE);
    if(!m) return undefined;
    return {
      protocol: m[1],
      user:     m[2],
      password: m[3],
      host:     m[4],
      port:     m[5],
      path:     m[6],
      query:    m[7]
    }
  },
  compileURI: function(obj) {
    var protocol = (obj.protocol || 'http') + '://' 
    var password = obj.password ? ':' + obj.password : '';
    var user = obj.user ? obj.user + password : '';
    var port = obj.port ? ':' + obj.port : '';
    var host = obj.host + port;
    var path = obj.path || '/';
    var query = obj.query ? '?' + query : '';
    return protocol + user + host + path + query;
  },
  first: function() {
    for (var i in arguments) if (arguments[i]!==undefined) return arguments[i];
  },
  copy: function (val) {
    switch((val||false).constructor) {
    default: return val;
    case Array: return val.concat();
    case Object: 
      var obj = {};
      for (var i in val) obj[i] = val[i];
      return obj;
    }
  },
  clone: function clone(val) {
    switch((val||false).constructor) {
      default: return val;
      case Array: return val.concat();
      case Object: 
        var obj = {};
        for (var i in val) obj[i] = clone(val[i]);
        return obj;
    }
  },
  _merge: function _merge(to,from) {
    for (var i in from) {
      var val = from[i];
      switch((val||false).constructor) {
      default: to[i] = val; continue;
      case Array: to[i] = val.concat(); continue;
      case Object: 
        if (!to[i] || to[i].constructor != Object) to[i] = {};
        _merge(to[i],val);
      }
    }
    return to;
  },
  merge: function() {
    var to = arguments[0];
    for (var i=1; i<arguments.length; i++) {
      utils._merge(to,arguments[i]);
    }
    return to;
  },
  _filter: function _filter(to,from,fn) {
    for (var i in from) {
      if (!fn(from[i],i)) continue;
      var val = from[i];
      switch((val||false).constructor) {
      default: to[i] = val; continue;
      case Array: to[i] = val.concat(); continue;
      case Object: 
        if (!to[i] || to[i].constructor != Object) to[i] = {};
        _filter(to[i],val);
      }
    }
    return to;
  },
  filter: function(obj) {
    var to = {};
    utils._filter(to,obj);
    return to;
  },
  _config: function _fillin(to,from) {
    for (var i in to) {
      var val = from[i];
      switch((val||false).constructor) {
      default: to[i] = val; continue;
      case Array: to[i] = val.concat(); continue;
      case Object: 
        _merge(to[i],val);
      }
    }
    return to;
  },
  config: function() {
    var to = arguments[0];
    for (var i=1; i<arguments.length; i++) {
      utils._config(to,arguments[i]);
    }
    return to;
  },
  flag: function flag(to, from, flags,prefix) {
    prefix = prefix || '$';
    for (var i in from) {
      var val = from[i];
      if(i.slice(0,prefix.length)==prefix) {
        if (flags[i.slice(1)]) flag(to,val,flags,prefix);
        continue;
      }
      switch((val||false).constructor) {
        default:    to[i] = val; break;
        case Array: to[i] = val.concat(); break;
        case Object: 
          if (!to[i] || to[i].constructor != Object) to[i] = {};
          flag(to[i],val,flags,prefix);
      }
    }
    return to;
  },
  untangle: function untangle (obj) {
    if (!obj || obj.constructor !== Object) return obj;
    var ret = {};
    for (var label in obj) {
      var value = obj[label];
      var parts = label.split('_');
      var name = parts.pop();
      var target = ret;
      for (var p in parts) {
        var part = parts[p];
        if (!target[part] || target[part].constructor != Object) target[part] = {};
        target = target[part];
      }
      target[name] = untangle(value);
    }
    return ret;
  },
  array: function(val) {
    switch((val||false).constructor) {
      default: return Array.prototype.slice.apply(val,[0]);
      case String: return val.trim().split(/\s*[|]\s*/);
//      case Object: var ret = []; for (var i in val) ret.push(val); return ret;
    }
  },
  _for: function(val,context,fn,rev) {
    if(!fn) fn = context, context = val;
    switch((val||false).constructor) {
    default: return;
    case String:
      val = val.trim().split(/\s*[|]\s*/);
    case Array:
    case Object:
      var ctx = context || val;
      var keys = Object.keys(val);
      if (rev) keys = keys.reverse();
      for (var i in keys) {
        var k = keys[i];
        switch (fn.apply(ctx,[val[k],k,i,val])) {
          case true: return;
          case false: return false;
          default: continue;
        }
      }
      return; 
    }
  },
  for: function(a1,a2,a3) {
    return a3 ? utils._for(a1,a2,a3) : utils.for(a1,a1,a2);
  },
  rfor: function(a1,a2,a3) {
    return a3 ? utils._for(a1,a2,a3,true) : utils.for(a1,a1,a2,true);
  },
  chain: function chain (fn,context,args,rev) {
    var ctx = context || args;
    switch((fn||false).constructor) {
    default: return fn;
    case Function: return fn.apply(ctx,args);
    case Array:
    case Object:
      var keys = Object.keys(fn);
      if (rev) keys = keys.reverse();
      for (var i in keys) {
        var k = keys[i];
        switch (chain(fn[k],context,args,rev)) {
          case true: return;
          case false: return false;
          default: continue;
        }
      }
      return;
    }
  },
  key: function key (val) {
    switch((val||false).constructor) {
    default: return String(val);
    case Number: return '_'+String(val);
    case Object:
      var keys = Object.keys(val).sort();
      var obj = {};
      var k;
      for (var i in keys) k = keys[i], obj[k] = val[k];
      val = obj;
    case Array:
      return JSON.stringify(val);
    }
  },
  cache: function cache (obj,name,key,make,context) {
    var k = utils.key(key);
    if(!obj[name] || obj[name].constructor != Object) utils.purge(obj,name);
    if(!(k in obj[name])) obj[name][k] = make.apply(context||obj,[key]);
    return obj[name][k];
  },
  purge: function purge (obj,name) {
    obj[name] = {};
  },
  code: function code (val,prefix) {
    switch((val||false).constructor) {
    default: return String(val);
    case String: return '"' + val.replace(/"/,'\\"') + '"';
//    case Function: return String(val).replace(/\n/,'\n'+prefix);
    case Object:
      var ret = [];
      for (var i in val) ret.push( '"' + i.replace(/"/,'\\"') + '" : ' + code(val[i]));
      return '{' + ret.join(',') + '}';
    case Array:
      var ret = [];
      for (var i in val) ret.push( code(val[i]) );
      return '[' + ret.join(',') + ']';
    }
  },
  keyCode: function(e) {
    var ret = [];
    if (e.altKey) ret.push('alt');
    if (e.metaKey) ret.push('meta');
    if (e.ctrlKey) ret.push('ctrl');
    if (e.shiftKey) ret.push('shift');
    ret.push(e.which);
    return ret.join('_');
  },
  esc: function(str) {
    if (typeof(str)=='object') str = JSON.stringify(str);
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
  guid: function() {
    return (Number(String(Math.random()).substr(2)).toString(36) + Number(String(Math.random()).substr(2)).toString(36)).substr(-16);;
  },
  ERR: function(msg,sev){
    sev = sev || 'FATAL';
    return {error:{severity:sev,message:msg}};
  },
  CALL: function (cbdata,cb,data,error,ctx) {
    if (cbdata && data) return cbdata.call(ctx||this,data);
    cb.call(ctx||this,error,data);
  }
}

var template = (function(){
  var cache = {};
  var re = /({{{(.*?)}}}|<\?(.*?)\?>|(.*?)(?=({{{|<\?|$)))/g;
  return function (str, data){
    var id;
		if (str.match && str.match(/^[\w-]+$/)) {
			if (cache[str]) return data ? cache[str].apply(data,[data]) : cache[str];
	  		id = str;
			str = $('script[type="text/html"]#'+str).text();
		} else {
			var $str = $(str);
			str = $str.html();
		}
		str = str.replace(/\s+/g,' ');
		var fn =
			"var _ret=[];"
		+	"with(obj) {"
		var m;
		re.lastIndex = 0;
		while((m = re.exec(str)) && m[0]) {
			if(m[2]) fn += "_ret.push(" + m[2]+"); ";
			else if (m[3]) fn += m[3]+" ";
			else if (m[4]) fn += "_ret.push('"+m[4].replace("'","\\'")+"'); ";
		}
		fn+= "};\n"
		+	"var ret = _ret.join('');\n"
		+	"return ret"
		fn = new Function("obj",fn);
		// Provide some basic currying to the user
		if (id) cache[id] = fn;
		return data ? fn.apply(data,[data]) : function(data) {
		  fn.apply(data,[data]);
		};
	};
})();

Function.prototype.overload = function(obj) {
  var names = this.toString().match(/^.*?[(](.*?)[)]/)[1].split(',');
  var pos = {}; names.forEach(function(n,i){
    pos[n]=i;
  })
  var fn = this;
  var cases = [];
  for (var i in obj) {
    cases.push(
      "case '"+i+"': "
    + "return fn.call(this,"
    + obj[i]
      .split(',')
      .reduce(function(r,n,i){
          r[pos[n]]='a['+i+']'; return r
      },[])
      .join(',')
      .split(',')
      .map(function(n){
        return n || 'undefined'
      }).join(',')
    + ');'
    )
  }
  var fn2 = new Function("fn","a",
      "\n  var s = a.map(function(n) {return Array.isArray(n) ? 'array' : typeof n;}).join(',');"
    + "\n  switch(s) {"
    + "\n    "+cases.join('\n    ')
    + "\n  }"
  );
  var fn3 = function(){
    return fn2.call(this,fn,Array.prototype.slice.call(arguments));
  }
  return fn3;
}

Function.prototype.partial = function(){
  var fn = this, args = Array.prototype.slice.call(arguments);
  return function(){
    var arg = 0;
    for ( var i = 0; i < args.length && arg < arguments.length; i++ )
      if ( args[i] === undefined )
        args[i] = arguments[arg++];
    return fn.apply(this, args);
  };
};


$.fn.scrollTable = function() {
  
  if(!this.hasClass('scrolltable-table')) wrap(this);
  var n = this.find('th').map(function(n){return $(this).text()}).toArray().join('<>');
  var o = this.parent().prev().find('>table th').map(function(n){return $(this).text()}).toArray().join('<>');
  if (n!=o) header(this);
  resize(this);
  
  function wrap(t) {
    t.addClass('scrolltable-table');
    $('<div>')
    .addClass('scrolltable-wrap')
    .insertBefore(t)
    .append(t);
    var s = $('<div>').addClass('scrolltable-scroll').insertBefore(t).append(t);
    var h = $('<div>').addClass('scrolltable-header').insertBefore(s).get(0);
    s.on('scroll', function() {
      h.scrollLeft = this.scrollLeft;
    });
  }
  
  function header(t) {
    t.parent().prev().html(
      t.clone(true)
      .children(':not(thead)')
          .remove()
      .end()
    );
  }
  
  function resize(t) {
    t.css('width','');
    var hh = t.find('> thead > tr:first-child > *');
    var c = t.parent().prev().find('>table');
    var cc = c.find(' > thead > tr:first-child > *');
    hh.css('width','');
    cc.css('width','');
    c.css('width','');
    
    var w = t.width()+20;
    t.width(w);
    c.width(w);
    hh.each(function(i) {
      var w = $(this).width();
      cc.eq(i).width(w);
      $(this).width(w);
    });
  }
} 


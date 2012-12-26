var utils = module.exports = {
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
    return {severity:sev,message:msg};
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
    console.log(i,n)
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
  console.log(fn2);
  var fn3 = function(){
    return fn2(fn,Array.prototype.slice.call(arguments));
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



// KULTURA info search
// (c) 2011 user:zocky @ wiki.ljudmila.org
// GPL 3.0 applies
//
// client application

/* expects results in the format:
{
	source: {
		id, 
		name, 
		home 
	},
	results: [{	
		url, 
		name, 
		description, 
		image 
	}, ... ]
}
*/

function esc(str) {
  if (typeof(str)=='object') str = JSON.stringify(str);
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

var template = (function(){
	var cache = {};
	var re = /({{{(.*?)}}}|<\?(.*?)\?>|(.*?)(?=({{{|<\?|$)))/g;
	return function (str, data){
		var id;
		if (str.match && str.match(/^[\w/]+$/)) {
			if (cache[str]) return data ? cache[str](data) : cache[str];
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
		+	"var $ret = $(_ret.join(''));\n"
		+	"return $ret"
		fn = new Function("obj",fn);
		// Provide some basic currying to the user
		if (id) cache[id] = fn;
		return data ? fn.apply(data,[data]) : function(data) {
		  fn[id].apply(data,[data]);
		};
	};
})();

// socket client;
	
var CLIENT = (function() {
	var me = {
		socket: null,
		connected: false
	};
	
	var guid = function() {
	  return Number(String(Math.random()).substr(2)).toString(36) + Number(String(Math.random()).substr(2)).toString(36)
	}
	
	var requests = {};
	function request(cmd,args,cb,cberr) {
    if (typeof (args) == 'function') cberr = cb, cb = args, args = {};
	  var id = guid();
	  args.id = id;
	  requests[id] = function(msg) {
	    delete requests[id];
      if (msg.error) {
        if (typeof(cberr) == 'function') cberr(msg.error);
        else if (!cberr) showError(msg.error.message || msg.error);
        else showError(msg.error.message || msg.error, cberr);
      } else cb && cb.apply(me,[msg.data]);
	  }
	  socket.emit(cmd,args);
	}
	
	function query (sql,args, cb, cberr) {
    if (typeof (args) == 'function') cberr = cb, cb = args, args = [];
    request('sql_query',{
        sql: sql,
        args: args||[]
    }, cb, cberr);
  }

	function queryPage (sql,args, opt, cb, cberr) {
    if (typeof (args) == 'function') cberr = opt, cb = args, opt = {}, args = [];
    else if (typeof (opt) == 'function') cberr = cb, cb = opt, opt = args;
    request('sql_querypage',{
        sql: sql,
        args: args||[],
        opt: opt||{}
    }, cb, cberr);
  }

  function resQueryPage(res,sql,args,opt,cb) {
    var $res = $(res);
    $res.addClass('busy');
    queryPage(sql,args,opt,function(data) {
      $res.removeClass('busy');
      cb.apply(me,[data]);
      $res.get(0).scrollIntoView();
    }, function(error) {
  	  console.log(error);
      $res.removeClass('busy');
      showError(error.message,$res);
      $res.get(0).scrollIntoView();
    });
  };
  function resQuery(res,sql,args,cb) {
    if (typeof (args) == 'function') cb = args, args = [];
    var $res = $(res);
    $res.addClass('busy');
    query(sql,args,function(data) {
      $res.removeClass('busy');
      cb.apply(me,[data]);
      $res.get(0).scrollIntoView();
    }, function(error) {
      $res.removeClass('busy');
      showError(error.message,$res);
      $res.get(0).scrollIntoView();
    });
  };
	
	var socket = io.connect(location.host);
	socket.on('welcome', function (data) {
		console.log('welcome!');
		showMessage('Socket to the server established. Please login.');
		me.connected = true;
		try {
		  var conn = JSON.parse(localStorage.noodeSession);
		  login(conn);

		  $('#sql').val(localStorage.noodeSQL||'');
		  $('#sql').on('input',function() {
		    localStorage.noodeSQL = this.value;
		  })
		} catch (e) {
		}
	});
	
	socket.on('respond',function(msg) {
	  var req = requests[msg.reqid];
	  if(!req) return console.log('unknown request id',msg.reqid);
	  req.apply(me,[msg]);
	});

	function showMessage(err,c,where) {
	  var $msg = $('<div></div>').addClass(c||'message');
	  if (typeof(err)!='string') err = JSON.stringify(err);
	  $msg.html(err);
	  if (where) $(where).find('.messages').append($msg);
	  else $('#results').append($msg);
	  $msg.get(0).scrollIntoView($msg);
	}

	function showSuccess(txt,where) {
	  showMessage(txt,'success',where);
	}
	 
	function showError(txt,where) {
	  showMessage(txt,'error',where);
	}
 
  
  function login(conn) {
    request('login',conn, function(ldata) {
      showMessage('You are now logged in as user <b>'+ldata.user+'</b>. The current database is <b>'+ldata.database +'</b>. The current schema is <b>'+ldata.schema+'</b>.');
      $('body').addClass('loggedin');
      localStorage.noodeSession = JSON.stringify(conn);
      request('list_schemas', function(data) {
        $('#schemas').children().slice(1).remove();
        for (var i in data.rows) {
          var row = data.rows[i];
          $('<option>').val(row.schema).html(row.schema + ' ('+row.tablecount+')').appendTo('#schemas');
        }
        $('#schemas').val(ldata.schema);
        $('#schemas').change();
      })
    });
  }
  var qi = function(s) {
    return s.match(/\W/) ? '"'+(s||'').replace(/"/g,'""') + '"' : s;
  }
  
  function getRowCount($result) {
    var sql = $result.data('sql');
    var opt = $result.data('opt');
    request('sql_querycount',{sql:sql}, function(data) {
      opt.totalrows = data;
      $result.find('.rowcount').text(opt.totalrows );
    }, function() {
      opt.totalrows = Infinity;
      $result.find('.rowcount').text('ERR');
    }) 
  }
  
  function getGridPage($result,r) {
    var sql = $result.data('sql');
    var opt = $result.data('opt');
    $result.find('.time').text(Time.now.format('H:i:s'));

    opt.offset = Math.max(0,(opt.offset | 0) + (r | 0) * (opt.limit || 20));
    
    resQueryPage($result, sql,[],opt, function(data) {
      $result.find('.showing').text ((opt.offset+1)+'-'+(opt.offset+data.rows.length));
      $result.find('.placeholder').html( template(data.rows.length ? 'tpl_grid' : 'tpl_norows',{
        rows: data.rows
      }));
      if (opt.orderby) $result.find('.grid .header th[data-column='+opt.orderby+']').addClass(opt.orderdesc ? 'orderdesc' : 'orderasc');
    });
  }
  
  function addSqlQueryPage(sql,opt) {
    opt = opt || {};
    
    var $result = $(template('tpl_result',{
      sql: sql,
      time: Time.now.format('H:i:s'),
      page: true
    })).appendTo('#results');
    $result.data({
      sql: sql,
      opt: opt
    })
    
    opt.limit = opt.limit || 20;
    opt.offset = opt.offset || 0;
    
    getRowCount($result);
    getGridPage($result);
  }
    
 
 
  
  function addSqlQuery(sql,opt) {
    opt = opt || {};
    
    var $result = $(template('tpl_result',{
      sql: sql,
      time: Time.now.format('H:i:s')
    })).appendTo('#results');
    $result.data({
      sql: sql,
      opt: opt
    })
    resQuery($result, sql, function(data) {
      showSuccess('<b>'+data.command + ' OK:</b> ' + data.rowCount+' rows affected.',$result);
      $result.find('.placeholder').html( template(data.rows.length ? 'tpl_grid' : 'tpl_norows',{
        rows: data.rows
      }));
/*        el.selectionStart = msg.error.position-1;
        el.selectionEnd = el.selectionStart + el.value.slice(el.selectionStart).match(/^(\w+|\W+|)/)[0].length;
        $(el).focus();
*/        
    });
  }
  
  function runSqlConfirm(sql,opt) {
    opt = opt || {};
    
    var $result = $(template('tpl_confirm',{
      sql: sql,
      time: Time.now.format('H:i:s'),
      message: opt.message
    })).appendTo('#results');
  }
  
  
  $(function() {
    showMessage('<b>Welcome to NOODE.</b>');
    $('#schemas').change(function() {
      request('list_tables', {schema:this.value},function(data) {
        $('#tables').children().remove();
        data.rows.sort(function(a,b) { return a.label < b.label ? -1 : 1 });
        for (var i in data.rows) {
          var row = data.rows[i];
          $(template('tpl_table', row)).appendTo('#tables');
        }
      });
      request('list_functions', {schema:this.value} ,function(data) {
        $('#functions').children().remove();
        data.rows.sort(function(a,b) { return a.label < b.label ? -1 : 1 });
        for (var i in data.rows) {
          var row = data.rows[i];
          $(template('tpl_function', row)).appendTo('#functions');
        }
      })
      
      
    })        
    $('.result .grid .column').live('click', function() {
      var $this = $(this);
      var col = $this.attr('data-column');
      var $res = $this.closest('.result');
      var opt = $res.data('opt');
      if (opt.orderby == col) opt.orderdesc = !opt.orderdesc;
      else {
        opt.orderby = col;
        opt.orderdesc = false;
      }
      getGridPage($res);
    });
    $('#tables .relation .button.browse').live('click', function() {
      addSqlQueryPage('table '+ qi($('#schemas').val())+'.'+qi($(this).closest('.relation').attr('data-relation')))
    });
    $('#tables .relation .button.drop').live('click', function() {
      runSqlConfirm('drop table '+ qi($('#schemas').val())+'.'+qi($(this).closest('.relation').attr('data-relation')))
    });
    $('#functions .function .button.def ').live('click', function() {
      query ('select pg_get_functiondef($1::oid) as def',[$(this).closest('.function').attr('data-oid')], function(data) {
        $('#sql').val(data.rows[0].def);
      })
    });
	  $('#login-go').click(function() {
	    console.log('logging in');
	    login({
	      host: $('#host').val(),
	      port: $('#port').val(),
	      database: $('#database').val(),
	      user: $('#user').val(),
	      password: $('#password').val(),
	    });
    })
    $('#logout-go').click(function() {
      localStorage.noodeSession = null;
	    request('log_out', function(data) {
        showMessage(data);
        $('body').removeClass('loggedin');
	    });
	  })
    $('.result .button.back').live('click',function() {
      getGridPage($(this).closest('.result'),-1);
	  }) 
    $('.result .button.first').live('click',function() {
      $(this).closest('.result').data('opt').offset = 0;
      getGridPage($(this).closest('.result'));
	  }) 
    $('.result .button.last').live('click',function() {
      var opt = $(this).closest('.result').data('opt');
      opt.offset = Math.floor(opt.totalrows/opt.limit)*opt.limit;
      getGridPage($(this).closest('.result'));
	  }) 
    $('.result .button.pagesize').live('click',function() {
      $(this).closest('.result').data('opt').limit = $(this).attr('data-pagesize')
      getGridPage($(this).closest('.result'));
	  }) 
	  $('.result .button.next').live('click'  ,function() {
      getGridPage($(this).closest('.result'),+1);
	  }) 	  
    $('.result .button.reload').live('click',function() {
      var $res = $(this).closest('.result');
      getRowCount($res);
      getGridPage($res);
	  }) 
	  $('.result .button.remove').live('click',function() {
      $(this).closest('.result').remove();
	  }) 	  
	  $('.result .button.confirm-no').live('click',function() {
      $(this).closest('.result').remove();
	  }) 	  
	  $('.result .button.confirm-yes').live('click',function() {
	    var $this = $(this);
	    var $res = $this.closest('.result');
	    var sql = $res.attr('data-sql');
	    resQuery($res,sql,[],function(data) {
        showSuccess('<b>'+data.command + ' OK:</b> ' + data.rowCount+' rows affected.',$result);
	    }, $res);
	  })
	  
	  function fixTextAreaHeight(t) {
	    var $t = $(t);
	    var lines = $t.val().split(/\n/).length;
	    $t.height(16*Math.min(lines,16)+8);
	  }
	  
	  $('.result .title').live('click', function() {
	    var $res = $(this).closest('.result');
	    $res.toggleClass('showeditor');
	    fixTextAreaHeight($res.find('.code'));
	  })
	  $('.result .code').live('input', function() {
	    fixTextAreaHeight(this);
	  })
	  
	  $(document).keydown(function(e) {
	    var r = [];
	    if (e.altKey) r.push('alt');
	    if (e.ctrlKey) r.push('ctrl');
	    if (e.shiftKey) r.push('shift');
	    r.push(e.which);
//	    console.log(r);
	    switch(r.join('|')) {
	    case 'shift|13':
	    case 'ctrl|13':
    	  $('#query-go').click();
    	  break;
    	default: return;
	    }
   	  e.preventDefault();
	  })
	  
	    
	  $('#query-go').click(function() {
	    var sql = $('#sql').val().trim();
      if (sql.match(/^(select|table)\b/i)) {
  	    addSqlQueryPage(sql);
  	  } else {
  	    addSqlQuery(sql);
  	  }
	  })
	  $('#clear').click(function() {
	    $('#results').html('');
	  })
	});
	return me;
})();



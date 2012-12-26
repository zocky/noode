Widget.parts = {
  tabs: {
  },
  tab: {
    setup: function($this,args,me) {
      if ($this.siblings().length==0) $this.addClass('selected');
      $this.find('>.tab-tab').click(function(){
        $this.addClass('selected').siblings().removeClass('selected');
      })
      if(args.selected) $this.addClass('selected').siblings().removeClass('selected');
    }
  },
  lsplit: {
    setup: function($this) {
      $this.find('> .split-splitter').drag(function( ev, dd ){
        $(this)
        .css('left',dd.offsetX)
        .prev()
        .css('width', dd.offsetX)
        .next().next()
        .css('left', dd.offsetX + $(this).width())
      });
    }
  },
  rsplit: {
    setup: function($this) {
      $this.find('> .split-splitter').drag(function( ev, dd ){
        var w = $(this).parent().width();
        $(this)
        .css('right',w-dd.offsetX-$(this).width())
        .next()
        .css('width', w-dd.offsetX-$(this).width())
        .prev().prev()
        .css('right',w-dd.offsetX)
      });
    }
  },
  hform:{
    setup: function($this,args,me) {
      $this.find('td input').on('input', function() {
        args.fields[$(this).attr('data-name')] = this.value;
      })
    }
  },
  hrow:{},
  console: {
    widget: true,
    setup:function($this,args,me) {
      me.session = args.session;
      $this.find('.clear').click(function(){
        $(me.places.conlet).empty();
        $(me.places.message).empty();
//        $this.find('>.scroller').find('>.conlet,>.message').remove();
      })
      $this.find('.newquery').click(function(){
        $(me.place.prompt).find('textarea').focus().get(0).scrollIntoView();
      })
    },
    extend: {
      conlet: function(a1,a2) {
        var args;
        if (a2) args = a2, args.content = a1;
        else if (typeof a1 == 'object') args = a1;
        else args = {content:a1}
        args.id = utils.guid();
        args.console = this;
        var w = this.widget('conlet',args);
        
        return w;
      },
      prompt: function(a1,a2) {
        var args;
        if (a2) args = a2, args.content = a1;
        else if (typeof a1 == 'object') args = a1;
        else args = {content:a1}
        args.console = this;
        this.widget('prompt',args);
      },
      message: function(m) {
        this.part('message',{message:m});
      }
    }
  },
  message: {
  },
  error: {
  },
  conlet: {
    widget: true,
    setup: function($this,args,me) {
      me.console = args.console;
      me.part('content',args.content||'sql',args);
      $this.find('.btn.remove').click(function(n) {
        me.trigger('remove');
        $this.remove();
        me.trigger('removed');
      });
    },
    extend: {
      request: function(cmd,args,cb) {
        var me = this;
        me.$widget.addClass('busy');
        me.console.session.request(cmd,args,function(error,data){
          me.$widget.removeClass('busy');
          if (error) {
            me.$widget.find('.editsql').addClass('in');
            me.$widget.find('.btn.edit').addClass('active');
            var ta = me.$widget.find('.code').get(0);
            ta.focus();
            if(error.position) {
              console.log(error.position);
              var start = (error.position|0)-1;
              var found = ta.value.substr(error.position-1).match(/^(\w+|\W+|)/)[0];
              var len = found.length;
              var end = start + len;
              
              ta.selectionStart = start;
              ta.selectionEnd = end;
              console.log(start,len,end,found,ta.selectionStart, ta.selectionEnd);
            }
            me.error(error.message);
            me.place.message.scrollIntoView();
          } else cb(data);
        })
      },
      message: function(m) {
        this.part('message',{message:m});
      },
      error: function(m) {
        this.part('message','error',{message:m});
      }
    }
  },
  prompt:{
    widget: true,
    setup: function($this,args,me) {
      me.console = args.console;
      me.part('content',args.content||'sql',args);
    },
  },
  prompt_sql: {
    setup: function($this,args,me) {
      me.console = args.console;
      var run = function() {
        var code = me.$('.code').val();
        me.$('.code').val('');
        console.log('prompt code',code)
        me.console.conlet('sql',{code:code});
      }
      $this.find('.code').keydown(function(e) {
        switch(utils.keyCode(e)) {
        case 'shift_13':
        case 'ctrl_13':
          run();
          e.preventDefault();
        }
      })
    }
  },
  sql: {
     setup: function($this,args,me) {
      me.Q = {
        offset:0,
        limit:20,
        filters:{},
        params:[]
      };
      me.part('query');
    },
  },
  queryres: {},
  query: {
    setup: function($this,args,me) {
      var run = function() {
        me.part('queryres');
        me.html('pager','');
        me.Q.offset = 0;
        me.Q.filters = {};
        var code = me.Q.code = me.$('.code').val();
        me.hasParams = false;
        if (code.match(/^('[^']*'|"[^"]*"|.)*[$]\d/)) {
          me.part('params');
          me.hasParams = true;
        }
        if (code.match(/^\s*(SELECT|TABLE)/i)) {
          me.part('pager');
        } else if (code.match(/^\s*(DROP|DELETE)/i)) {
          me.part('confirm');
        } else {
          me.part('exec');
        }
        me.html('title',code);
      }
      me.$widget.find('.code').keydown(function(e) {
        switch(utils.keyCode(e)) {
        case 'shift_13':
        case 'ctrl_13':
          run();
          e.preventDefault();
        }
      })
      me.$widget.find('.btn.run').click(run);
      run();
    }
  },
  exec: {
    setup: function($this,args,me) {
      me.request('query',me.Q, function (data) {
        me.part('grid',data);
      });
    }
  },
  pager: {
    setup: function($this) {
      var me = this;

      $this.find('button.limit[value='+me.Q.limit+']').addClass('active');
      
      $this.find('button.limit').click(function() {
        me.Q.limit = ( this.value | 0 );
        me.part('page');
      });
      $this.find('button.first').click(function() {
        me.Q.offset = 0;
        me.part('page');
      });
      $this.find('button.back').click(function() {
        me.Q.offset -= me.Q.limit;
        me.part('page');
      });
      $this.find('button.next').click(function() {
        me.Q.offset += me.Q.limit;
        me.part('page');
      });
      $this.find('button.last').click(function() {
        me.Q.offset = me.rowCount;
        me.part('page');
      });
      me.part('firstpage');
    }
  },
  firstpage: {
    make:function(args,me) {
      me.request('page',me.Q, function (data) {
        console.log('result',data);
        me.$widget.removeClass('busy');
        me.part('grid',data);
      });
    }
  },
  page: {
    make:function(args,me) {
      me.request('page',me.Q, function (data) {
        me.part('rows',data);
      });
    }
  },
  grid: {
    setup: function($this,data,me) {
      me.part('columns',data);
      me.part('rows',data);
    }
  },
  columns:{
    setup: function($this,args,me) {
      $this.find('.field').click(function() {
        var f = $(this).attr('data-column');
        if (me.Q.sort == f) {
          me.Q.reverse = !me.Q.reverse;        
        } else {
          me.Q.sort = f;
          me.Q.reverse = false;
        }
        $(this)
        .addClass('sort')
        .toggleClass('reverse',me.Q.reverse)
        .siblings()
        .removeClass('sort')
        me.part('page');
      })
      $this.find('.filter input').change(function() {
        var f = $(this).closest('[data-column]').attr('data-column');
        me.Q.filters[f] = this.value;
        me.part('page');
      })
    }
  },
  rows:{
    setup: function($this,args,me) {
      $this.closest('table').scrollTable();
      me.$('.yfilter input').each(function(){
        var $this = $(this);
        $this.width(10);
        setTimeout(function(){
          $this.width($this.parent().width());
        },0);
      })
      me.$widget.get(0).scrollIntoView();
    }
  },
  confirm:{
    setup: function($this,args,me) {
      $this.find('.confirm-yes').click(function() {
        me.part('exec');
      })
      $this.find('.confirm-no').click(function() {
        $this.html('Operation cancelled.')
      })
    }
  },
  loginform:{
  },
  login: {
    setup: function($this,args,me) {
      me.Q = {auth:{}};
      $this.find('.server').change(function(){
        //var oldsrv = args.NOODE.servers[me.Q.server] || {};
        me.Q.server = this.value;
        var srv = NOODE.conf.servers[this.value];
        var newauth = {};
        for (var i in srv.login) {
          newauth[i]= srv.login[i] || me.Q.auth[i];
        }
        me.Q.auth=newauth;
        me.part('form','hform',{
          fields:me.Q.auth
        });
      }).change();
      $this.find('button.login').click(function() {
        NOODE.newConnection(me.Q);
      });
    }
  },
  connection: {
    setup: function($this,args,me) {
    
      me.conid = args.conid
      me.Q = args.Q;
      var srv = NOODE.conf.servers[me.Q.server];
      me.part('form','hrow',{fields:[{server:me.Q.server},me.Q.auth]});
      
      //me.$('[data-place=title]').addClass('if if-connected');
      $this.find('button.connect').click(function() {
        NOODE.login(me.Q,me);
      });
      $this.find('button.disconnect').click(function() {
      //TODO
      });
      me.$widget.attr('data-conid',args.conid);
      
      $(document).on('sessionconnected', function(e,conid) {
        if(me.conid == conid) me.$widget.addClass('connected');
      });
      
      me.on('remove',function(a) {
        console.log('hey hey hey',a);
      })
    }
  }
}

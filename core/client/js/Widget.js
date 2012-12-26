
function Widget(kind,opt,init) {
  this.kind = kind;
  this.place = {};
  this.places = {};
  this.events = {};
  
  this.make(kind,opt,function($this,args,me){
    me.$widget = $this;
    if (typeof(init)=='function') init.apply(this,[me.$widget,args,this]);
    else if (init) $(init).eq(0).html(this.$widget);
  });
}

Widget.prototype = {
  on: function(name,cb) {
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
  throw: function(e) {
    throw(e);
  },
  clear: function(n) {
    n = n ? '='+n : '';
    this.$('[data-place'+n+']').empty();
    this.$('[data-places'+n+']').empty();
  },
  $: function(sel) {
    return this.$widget.find(sel);
  },
  html: function(place,html) {
    if (this.place[place]) $(this.place[place]).html(html);
    else if (this.places[place]) (this.places[place]).append(html);
    else console.log('cannot place',$n)
  },
  part: function(a1,a2,a3) {
    var place,kind,args;
    if (typeof a3=='object') 
      place = a1, kind = a2, args = a3;
    else if (typeof a2 == 'object') 
      place = kind = a1, args = a2;
    else if (typeof a2 == 'string')
      place = a1, kind = a2, args = {}
    else if (!a2) place = kind = a1, args = {};
    var $ret;
    
    this.make(kind,args, function($n) {
      $ret = $n;
      if ($n) {
        if (this.place[place]) $(this.place[place]).html($n);
        else if (this.places[place]) $n.appendTo(this.places[place]);
        else console.log('cannot place',$n)
      }
    })
    return $ret;
  },
  widget: function(a1,a2,a3) {
    var place,kind,args;
    if (typeof a3=='object') 
      place = a1, kind = a2, args = a3;
    else if (typeof a2 == 'object') 
      place = kind = a1, args = a2;
    else if (typeof a2 == 'string')
      place = a1, kind = a2, args = {}
    else if (!a2) place = kind = a1, args = {};
    var me = this;
    var n = new Widget (kind,args, function($n) {
      if ($n) {
        if (me.place[place]) $(me.place[place]).html($n);
        else if (me.places[place]) $n.appendTo(me.places[place]);
        else console.log('cannot place',place,$n)
      }
    });
    return n;
  },
  make: function(kind,args,init) {
    var P = Widget.parts[kind];
    if (!P) this.throw('no such kind '+kind);
    args.me = this;
    var me = this;
    var $el = P.make 
    ? P.make.apply(this,[args,this]) 
    : $(template('part-'+ (P.template || kind),args));
   // console.log('#part-'+(P.template || kind),$('#part-'+(P.template || kind)));
    init && init.apply(this,[$el,args,this]);
    if ($el) {
      $el.find('[data-place]').andSelf('[data-place]').each(function(){
        var pp = this;
        var p = $(this).attr('data-place');
        p.split(/\s+/).forEach(function(n) {
          me.place[n] = pp;
          //console.log('place',n)
        });
      })
      $el.find('[data-places]').andSelf('[data-places]').each(function(){
        var pp = this;
        var p = $(this).attr('data-places');
        p.split(/\s+/).forEach(function(n) {
          me.places[n] = pp;
          console.log('places',n)
        });
      })
    }
    for (var i in P.extend) this[i] = P.extend[i];
    P.init && P.init.apply(this,[$el,args,this]);
    P.setup && P.setup.apply(this,[$el,args,this]);
    return $el;
  }
}

var Time = function(d) {
  if (!(this instanceof Time)) return new Time(d);
  this.DATE = d=== undefined ? new Date() : new Date(d);
  if (isNaN(this.DATE)) {
    console.log('failed',d);
    this.DATE = new Date('1970-01-01 '+d);
  }
}
Time.__defineGetter__('now', function() {
  return new Time();
});
Time.__defineGetter__('today', function() {
  return new Time().time(0);
});
Time.__defineGetter__('yesterday', function() {
  return new Time().time(0).days(-1);
});
Time.__defineGetter__('tomorrow', function() {
  return new Time().time(0).days(-1);
});
Time.__defineGetter__('oclock', function() {
  return new Time().DATE(0);
});

Time.prototype = {
  clone: function() {
    return new Time(this);
  },
  toString: function() {
    return this.DATE.valueOf();
  },
  valueOf: function() {
    return this.DATE.valueOf();
  },
  year: function () {
    if (!arguments.length) return this.DATE.getYear()+1900;
    this.DATE.setYear(arguments[0]-1900); return this;
  },
  month: function() {
    if (!arguments.length) return this.DATE.getMonth()+1;
    this.DATE.setMonth(arguments[0]-1); return this;
  },
  day: function() {
    if (!arguments.length) return this.DATE.getDate();
    this.DATE.setDate(arguments[0]); return this;
  },
  weekday: function() {
    if (!arguments.length) return this.DATE.getDay();
    if (arguments[1] === undefined) return this.days(-this.weekday()).days(arguments[0]);
    return this.days((arguments[0]-this.weekday() - 7) % 7 + 7 * arguments[1]);
  },
  hour: function () {
    if (!arguments.length) return this.DATE.getHours();
    this.DATE.setHours(arguments[0]); return this;
  },
  minute: function () {
    if (!arguments.length) return this.DATE.getMinutes();
    this.DATE.setMinutes(arguments[0]); return this;
  },
  second: function () {
    if (!arguments.length) return this.DATE.getSeconds();
    this.DATE.setSeconds(arguments[0]); return this;
  },
  millisecond: function () {
    if (!arguments.length) return this.DATE.getMilliseconds();
    this.DATE.setMilliseconds(arguments[0]); return this;
  },
  milli: function () {
    if (!arguments.length) return this.DATE.getMilliseconds();
    this.DATE.setMilliseconds(arguments[0]); return this;
  },
  timestamp: function () {
    if (!arguments.length) return this.DATE.getTime();
    this.DATE.setTime(arguments[0]); return this;
  },
  time: function () {
    if (!arguments.length) return this.clone().year(1970).month(1).day(1);
    this.DATE.setTime(this.date()+arguments[0]); return this;
  },
  date: function () {
    if (!arguments.length) return this.clone().hour(0).minute(0).second(0).millisecond(0);
    this.DATE.setTime(arguments[0]+this.time()); return this;
  },
  years: function (d) {
    this.DATE.setYear(this.DATE.getYear()+d);
    return this;
  },
  months: function(d) {
    this.DATE.setMonth(this.DATE.getMonth()+d);
    return this;
  },
  days: function(d) {
    this.DATE.setDate(this.DATE.getDate()+d);
    return this;
  },
  hours: function (d) {
    this.DATE.setHours(this.DATE.getHours()+d);
    return this;
  },
  minutes: function (d) {
    this.DATE.setMinutes(this.DATE.getMinutes()+d);
    return this;
  },
  seconds: function (d) {
    this.DATE.setMinutes(this.DATE.getMinutes()+d);
    return this;
  },
  milliseconds: function (d) {
    this.DATE.setMilliseconds(this.DATE.getMinutes()+d);
    return this;
  },
  millis: Time.prototype.milliseconds,
  sunday: function(n) {
    return this.weekday(0,n);
  },
  monday: function(n) {
    return this.weekday(1,n);
  },
  tuesday: function(n) {
    return this.weekday(2,n);
  },
  wednesday: function(n) {
    return this.weekday(3,n);
  },
  thursday: function(n) {
    return this.weekday(4,n);
  },
  friday: function(n) {
    return this.weekday(5,n);
  },
  saturday: function(n) {
    return this.weekday(6,n);
  },
  timezone: function() {
    var m = this.DATE.toString().match(/\(([^)]+)\)$/);
    if (m) return m[1];
    var o = this.offset();
    return 'UTC' + this.format('O');
  },
  offset: function() {
    return -this.DATE.getTimezoneOffset()*60000;
  },
  offsetSign: function() {
    return ['+','-'][0|(this.offset()<0)];
  },
  format: function(f) {
    f = f || 'Y-m-d h:i:s.x';
    var d = this;
    var out = '';
    for (var i = 0; i<f.length; i++) {
      if(f[i]=='\\') {
        out+=f[++i];
      } else {
        out += Time.formats[f[i]] ? Time.formats[f[i]].apply(this) : f[i];
      }
    }
    return out;
  }
}

Time.pad=function(s1,s2) {
  return (String(s1)+String(s2)).slice(-s1.length);
}

Time.formats = {
  d: function() {
    return Time.pad('00',this.day());
  },
  D: function() {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][this.weekday()];
  },
  j: function() {
    return this.day();
  },
  l: function() {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][this.weekday()];
  },
  N: function() {
    return this.weekday() || 7;
  },
  S: function() {
    return ['th','st','nd','rd'][Math.min(3,this.day() % 20)];
  },
  w: function() {
    return this.weekday();
  },
  z: function() {
    // todo;
  },
  /////////////////////////////////        
  W: function() {
    // todo;
  },
  /////////////////////////////////        
  F: function() {
    return ['','January','February','March','April','May','June','July','August','September','October','November','December'][this.month()];
  },
  m: function() {
    return Time.pad('00',this.month());
  },
  M: function() {
    return ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][this.month()];
  },
  n: function() {
    return this.month();
  },
  t: function() {
//        return this.daysInMonth();
  },
  //////////////////////////////////
  L: function() {
//        return this.isLeapYear();
  },
  o: function() {
    //??? TODO;
  },
  Y: function() {
    return this.year();
  },
  y: function() {
    return Time.pad('00',this.year()%100);
  },
  //////////////////////////////////
  a: function() {
    return this.hour()<12 ? 'am' : 'pm';
  },
  A: function() {
    return this.hour()<12 ? 'AM' : 'PM';
  },
  B: function() {
    return Time.pad('000',(this.time()/(24*60*60*1000)*1000)|0);
  },
  g: function() {
    return Time.pad('00',this.hour()%12);
  },
  G: function() {
    return this.hour()%12;
  },
  h: function() {
    return this.hour();
  },
  H: function() {
    return Time.pad('00',this.hour());
  },
  i: function() {
    return Time.pad('00',this.minute());
  },
  s: function() {
    return Time.pad('00',this.second());
  },
  u: function() {
    return Time.pad('00',this.millisecond())+'000';
  },
  //////////////////////////////////
  e: function() {
    return this.timezone();
  },
  O: function() {
    return this.offsetSign() + Time(this.offset()/60000).format('Hi');
  },
  P: function() {
    return this.offsetSign() + Time(this.offset()/60000).format('H:i');
  },
  T: function() {
    return this.timezone();
  },
  Z: function() {
    return this.offset()/1000;
  },
  //////////////////////////////
  c: function() {
    return this.format('Y-m-d\TH:i:sP');
  },
  r: function() {
    return this.format('D, j M Y H:i:sP');
  },
  U: function() {
    return 0|(this.DATE.valueOf()/1000);
  },
  /////////////////////////////
  //aA Bc dDe FgGhHiIj  lLmMnNoO P  r sStTuU  wW  yYzZ
  //     C            kK          qQ        vV  xX
  //  b      E                  p    R          
  x: function() {
    return Time.pad('000',this.millisecond());
  },
  X: function() {
    return this.valueOf();
  },
  k: function() {
    return this.DATE.toDateString();
  },
  K: function() {
    return this.DATE.toLocaleDateString();
  },
  q: function() {
    return this.DATE.toTimeString();
  },
  Q: function() {
    return this.DATE.toLocaleTimeString();
  },
  v: function() {
    return this.DATE.toString();
  },
  V: function() {
    return this.DATE.toLocaleString();
  },
  C: function() {
    return this.DATE.toISOString();
  }
}

Time.extra = {
}

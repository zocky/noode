Noode.stateVersion = 1;
Noode.stateBlank = {
  version: Noode.stateVersion,
  connections: {
/*
    conid: {
      name: 'my connection',
      _password: 'f00b',
      _connected: false,
      queries: {
        {
        }
      }
    }
*/    
  }
}

Noode.saveState = function(s) {
  s = Noode.sleep();
  s.version = Noode.stateVersion;
  SessionStorage.NOODE = JSON.stringify(s);
  LocalStorage.NOODE = JSON.stringify(s.filter(function(n,i){
    return i[0]!='_';
  }));
}

Noode.loadState = function() {
  try {
    s = JSON.parse(sessionStorage.NOODE);
  } catch (e) {
    try {
      s = JSON.parse(localStorage.NOODE);
    } catch (e) {
      s = utils.merge({},Noode.blankState)
    }
  }
  if (s.version != Noode.stateVersion) s = noode.blankState();
  Noode.wake(s);
}
Noode.wake(state) {
  Noode.Client.wake(state.client);
}

Noode.sleep() {
  return {
    client: this.client.sleep();
  }
}

Noode.giveEvents = function(obj) {
  obj.handlers = {};
  obj.on = function(ev,cb) {
    if (!obj.handlers[ev]) obj.handlers[ev] = new $.Callbacks();
    obj.handlers[ev].add(cb);
  };
  obj.off = function(ev,cb) {
    if (!obj.handlers[ev]) return;
    obj.handlers[ev].remove(cb);
  };
  obj.fire = function(ev) {
    if (!obj.handlers[ev]) return;
    var args = [].slice.call(arguments,1);
    args = [].concat.apply([],args);
    obj.handlers[ev].fire.apply(this,args);
  };
}



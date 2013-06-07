var DM = (function(options) {
  var _modules,
    udf;

  console.log(options);

  function Module(callback, context) {
    this.body = callback;
    this.context = context;
  }

  Module.STATES = {
    INITIAL : 0,
    STARTED : 1,
    BEFORE  : 2,
    BODY    : 3,
    AFTER   : 4
  };

  Module.prototype._before = {};
  Module.prototype._after = {};
  //Module.prototype._callback = null;
  Module.prototype.context = null;
  Module.prototype._state = 0;

  Module.prototype.before = function(callback, context) {};

  Module.prototype.after = function(callback, context) {};

  Module.prototype.body = function(callback, context) {};

  Module.prototype.execute = function() {
    //console.log(this);
    if(typeof(this.body) === 'function') {
      this.body.call(this.context);
    }
  };

  Module.prototype.continue = function() {};

  Module.prototype.stop = function() {};

  _modules = {};

  return {
    add : function(name, callback, context) {
      if (typeof _modules[name] !== 'undefined') {
        throw new Error('Module `' + name + '` is already defined');
      }
      _modules[name] = new Module(callback, context);
    },
    before : function(name, callback, context) {

    },
    after : function(name, callback, context) {

    },
    go : function() {
      //console.log(_modules);
      for(i in _modules) {
        if (_modules.hasOwnProperty(i)) {
          _modules[i].execute();
        }
      }
    }
  };
})({
  env     : {
    win      : window,
    document : document
  },
  engines : {
    j : typeof jQuery === 'function' && jQuery,
    y : typeof YUI === 'function' && YUI
  }
});

DM.add('test', function(){
  console.group('test module');
  console.log(arguments, this);
  console.groupEnd('test module');
}, {
  a: 1
});

DM.go();
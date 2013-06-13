/*
 * DOM Markers 0.2.0
 * Copyright 2013 Eugene Poltorakov
 * Licensed under the MIT License: http://www.opensource.org/licenses/mit-license.php
 */

var DM, DMUtils;

DMUtils = {
  /**
   * Each utility function
   * @param {Object} obj
   * @param {Function} callback
   * @param {Object?} context
   */
  each : function(obj, callback, context) {
    var i;

    for(i in obj) {
      if (obj.hasOwnProperty(i)) {
        callback.call(context, obj[i], i, obj);
      }
    }
  },
  map : function(arr, callback, context) {
    return arr.map(callback, context);
  },
  /**
   * @param {String} selector
   * @param {HTMLElement|HTMLDocument|?} ctx
   * @returns {NodeList}
   */
  all : function(selector, ctx) {
    if (!(ctx instanceof HTMLElement || ctx instanceof HTMLDocument)) {
      ctx = document;
    }

    return ctx.querySelectorAll(selector);
  },
  trim : function(str) {
    return str.trim();
  },
  /**
   *
   * @param {HTMLElement} node
   * @return {Array.<{name:String,args:Array}>}
   */
  getModules : function(node) {
    return DMUtils.map(node.getAttribute('data-marker').match(/([a-z\-]+(\[[^[]+\])?)/ig) || [], function(str) {
      var parts = str.match(/[^\[\]]+/ig),
        name,
        args;

      name  = parts.shift();
      //todo - parse json hash
      args = parts[0] ? DMUtils.map(parts[0].split(','), DMUtils.trim) : [];

      //convert arguments to native types
      DMUtils.each(args, function(value, key, data) {
        if (value === 'false') {
          data[key] = !1;
        }
        else if (value === 'true') {
          data[key] = !0;
        }
        else if (value == parseFloat(value)) {
          data[key] = parseFloat(value);
        }
        else if (value === 'null') {
          data[key] = null;
        }
      });

      return {
        name : name,
        args : args
      };
    });
  },
  filter : function(arr, callback) {
    return arr.filter(callback);
  },
  filterModules : function(node, modules) {
    return DMUtils.filter(modules, function(module) {
      var _data = node._dm || (node._dm = {}),
        result = false;

      if (!_data[module.name]) {
        _data[module.name] = true;
        result = true;
      }
      return result;
    });
  },
  /**
   * @returns {Function}
   */
  uuid : (function() {
    var uuid = 0;
    return function() {
      return ++uuid;
    };
  })()
};

/**
 *
 * @param {Function?} callback
 * @param {*?} context
 * @constructor
 */
function DMModule(callback, context) {
  this.uuid = DMUtils.uuid();

  this._before = [];
  this._after = [];
  this._add = {
    callback : callback,
    context  : context
  };
  this.ready = false;
}

DMModule.prototype._sort = function(arr){
  arr.sort(function(a, b){
    var result;

    if (a.weight === b.weight) {
      result = 0;
    }
    else {
      result = a.weight > b.weight ? 1 : -1;
    }

    return result;
  });
  return this;
};
DMModule.prototype.prepare = function(){
  this._sort(this._before)._sort(this._after);
  this.ready = true;
  return this;
};
/**
 * @param {Function} callback
 * @param {*?} context
 * @param {Number?} weight
 * @returns {Number}
 */
DMModule.prototype.before = function(callback, context, weight){
  var id = DMUtils.uuid();

  this.ready = false;

  this._before.push({
    callback : callback,
    context  : context,
    weight   : weight || 0,
    uuid     : id
  });

  return id;
};
/**
 * @param {Function} callback
 * @param {*?} context
 * @param {Number?} weight
 * @returns {Number}
 */
DMModule.prototype.after = function(callback, context, weight){
  var id = DMUtils.uuid();

  this.ready = false;

  this._after.push({
    callback : callback,
    context  : context,
    weight   : weight || 0,
    uuid     : id
  });

  return id;
};

function DMExec(module, node, args) {
  this.module = module;
  this.node = node;
  this.args = args;

  this._state = 0;
  this._index = 0;
  this.context = null;
  this._waiting = null;
  this._timer = null;
}

DMExec.STATES = {
  INITIAL  : 0,
  BEFORE   : 1,
  MAIN     : 2,
  AFTER    : 3,
  FINISHED : 4
};

DMExec.TYPES = {
  NEXT : 'next',
  STOP : 'stop'
};

DMExec.prototype.next = function(){
  if (this._waiting) {
    this._waiting = false;
    clearTimeout(this._timer);
  }
  this._index++;
  this.execute(DMExec.TYPES.NEXT);
};
DMExec.prototype.stop = function(){
  if (this._waiting) {
    this._waiting = false;
    clearTimeout(this._timer);
  }
  this._index = 0;
  this._state = DMExec.STATES.FINISHED;
  this.execute(DMExec.TYPES.STOP);
};
/**
 *
 * @param {String?} type
 * @returns {*}
 */
DMExec.prototype.execute = function(type){
  var states = DMExec.STATES,
    types = DMExec.TYPES,
    module = this.module,
    obj;

  if (!(type === types.NEXT && this._state === states.INITIAL)) {
    if (!module.ready) {
      module.prepare();
    }
  }

  if (this._state === states.INITIAL) {
    this._state = states.BEFORE;
  }

  //noinspection FallthroughInSwitchStatementJS
  switch (this._state) {
    case states.BEFORE:
    case states.AFTER:
      obj = module[this._state === states.BEFORE ? '_before' : '_after'][this._index];

      if (obj && typeof obj.callback === 'function') {
        this.context = obj.context;
        obj.callback.apply(this, this.args);
      }
      else {
        this._state = this._state === states.BEFORE ? states.MAIN : states.FINISHED;
        this._index = -1;
        //this.next();
      }
      break;
    case states.MAIN:
      if (typeof module._add.callback === 'function') {
        this.context = module._add.context;
        module._add.callback.apply(this, this.args);
      }
      this._state = states.AFTER;
      this._index = -1;
      break;
    case states.FINISHED:
      this._state = states.INITIAL;
      this._index = 0;
      this.context = null;
      break;
    default:
  }

  if (this._state !== states.INITIAL && !this._waiting) {
    this.next();
  }

  return this;
};
DMExec.prototype.wait = function(timeout, stop){
  var self = this;

  this._waiting = true;

  this._timer = setTimeout(function(){
    self[stop ? 'stop' : 'next']();
  }, timeout || 5000);
};


DM = (function(options) {
  var _modules = {},
    _engine;

  function initEngine(callback) {
    if (!_engine) {
      if (options.engines.y) {
        //_engine = options.engines.y;
        options.engines.y().use('node-base', 'array-extras', function(Y) {
          DMUtils.all = function(selector, ctx){
            //todo - add context support
            return Y.all(selector).getDOMNodes();
          };

          DMUtils.map = function(arr, callback, context){
            return Y.Array.map(arr, callback, context);
          };

          DMUtils.filter = function(arr, callback){
            return Y.Array.filter(arr, callback);
          };

          DMUtils.trim = function(str){
            return Y.Lang.trim(str);
          };

          _engine = Y;

          callback();
        });
      } else if (options.engines.j) {
        _engine = options.engines.j;

        DMUtils.all = function(selector, ctx){
          return Array.prototype.slice.call(_engine(selector, ctx));
        };

        DMUtils.map = function(arr, callback, context){
          return _engine.map(arr, callback);
        };

        DMUtils.filter = function(arr, callback){
          return _engine.grep(arr, callback);
        };

        DMUtils.trim = function(str){
          return _engine.trim(str);
        };

        callback();
      }
      else {
        _engine = true;
        callback();
      }
    }
    else {
      callback();
    }
  }

  /**
   * Create new {DMModule} instance
   * @param {string} name
   * @param {Function?} callback
   * @param {Object?} context
   * @returns {DMModule}
   */
  function createModule(name, callback, context) {
    return _modules[name] = new DMModule(callback, context);
  }

  /**
   * Get existing module or false
   * @param {String} name
   * @returns {DMModule|Boolean}
   */
  function getModule(name) {
    var module = _modules[name];

    return module instanceof DMModule ? module : false;
  }

  return {
    /**
     *
     * @param {String} name
     * @param {Function?} callback
     * @param {*?} context
     * @returns {Number}
     */
    add : function(name, callback, context) {
      var module = getModule(name);
      if (module) {
        if (typeof module._add.callback === 'function') {
          throw new Error('Module(' + name + ') main callback is already defined');
        }
        else {
          module._add.callback = callback;
          module._add.context = context;
        }
      }
      else {
        module = createModule(name, callback, context);
      }

      return module.uuid;
    },
    /**
     *
     * @param {String} name
     * @param {Function} callback
     * @param {*?} context
     * @param {Number?} weight
     * @returns {Number}
     */
    before : function(name, callback, context, weight) {
      var module = getModule(name) || createModule(name);

      if (typeof callback !== 'function') {
        throw new Error('Callback should be a function');
      }

      return module.before(callback, context, weight);
    },
    /**
     *
     * @param {String} name
     * @param {Function} callback
     * @param {*?} context
     * @param {Number?} weight
     * @returns {Number}
     */
    after : function(name, callback, context, weight) {
      var module = getModule(name) || createModule(name);

      if (typeof callback !== 'function') {
        throw new Error('Callback should be a function');
      }

      return module.after(callback, context, weight);
    },
    go : function() {
      initEngine(function() {
        var nodes = DMUtils.all('[data-marker]', options.env.document);

        DMUtils.each(Array.prototype.slice.call(nodes), function(node) {
          var modules = DMUtils.getModules(node);

          modules = DMUtils.filterModules(node, modules);

          DMUtils.each(modules, function(data) {
            var module = getModule(data.name);

            if (module) {
              (new DMExec(module, node, data.args)).execute();
            }
          });
        });
      });
      return this;
    },
    /**
     *
     * @param {Number} uuid
     */
    detach : function(uuid) {
      var name,
        i,
        obj,
        module,
        found = false;

      //check all the modules
      //try to find uuid in module or inside the before/afters
      for(name in _modules) {
        if (_modules.hasOwnProperty(name)) {
          module = _modules[name];

          if (module.uuid === uuid) {
            //remove _add c/c
            module._add.context = null;
            module._add.callback = null;
            found = true;
          }
          else {
            for(i in module._before) {
              if (module._before.hasOwnProperty(i)) {
                obj = module._before[i];
                if (obj.uuid === uuid) {
                  module._before.splice(i, 1);
                  found = true;
                  break;
                }
              }
            }

            if (!found) {
              for(i in module._after) {
                if (module._after.hasOwnProperty(i)) {
                  obj = module._after[i];
                  if (obj.uuid === uuid) {
                    module._after.splice(i, 1);
                    found = true;
                    break;
                  }
                }
              }
            }
          }

          if (found) {
            break;
          }
        }
      }
      return this;
    },
    /**
     * Remove module from DM
     * @param name
     * @returns {DM}
     */
    remove : function(name) {
      if (_modules[name]) {
        delete _modules[name];
      }
      return this;
    },
    /**
     * Remove all modules from DM registry
     * @returns {DM}
     */
    removeAll : function() {
      _modules = {};
      return this;
    }
  };
})({
  env     : {
    win      : typeof window !== 'undefined' && window,
    document : typeof document !== 'undefined' && document
  },
  engines : {
    j : typeof jQuery === 'function' && jQuery,
    y : typeof YUI === 'function' && YUI
  }
});

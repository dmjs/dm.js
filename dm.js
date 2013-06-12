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
   * @param {Function} callback
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
  }
};

function DMModule(callback, context) {
  this.body = callback;
  this.context = context;
}

DMModule.prototype = {
  constructor : DMModule,
  _before     : [],
  _after      : [],
  body        : null,
  context     : null,
  ready       : false,
  _sort       : function(arr){
    arr.sort(function(a,b) {
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
  },
  prepare : function() {
    this._sort(this._after)._sort(this._before);
    this.ready = true;
    return this;
  },
  before   : function(callback, context, weight){
    this.ready = false;

    this._before.push({
      callback : callback,
      context  : context,
      weight   : weight || 0
    });

    return this;
  },
  after    : function(callback, context, weight){
    this.ready = false;

    this._after.push({
      callback : callback,
      context  : context,
      weight   : weight || 0
    });

    return this;
  }
};

function DMExec(module, node, args) {
  this.module = module;
  this.node = node;
  this.args = args;
}

DMExec.STATES = {
  INITIAL  : 0,
  BEFORE   : 1,
  BODY     : 2,
  AFTER    : 3,
  FINISHED : 4
};

DMExec.TYPES = {
  NEXT : 'next',
  STOP : 'stop'
};

DMExec.prototype = {
  constructor : DMExec,
  state       : 0,
  index       : 0,
  module      : null,
  node        : null,
  args        : null,
  context     : null,
  next : function(){
    this.index++;
    this.execute(DMExec.TYPES.NEXT);
  },
  stop : function(){
    this.index = 0;
    this.state = DMExec.STATES.FINISHED;
    this.execute(DMExec.TYPES.STOP);
  },
  /**
   *
   * @param {String?} type
   * @returns {*}
   */
  execute : function(type) {
    var states = DMExec.STATES,
      types = DMExec.TYPES,
      module = this.module,
      obj,
      nextState,
      result;

    if (!(type === types.NEXT && this.state === states.INITIAL)) {
      if (!module.ready) {
        module.prepare();
      }
    }

    if (this.state === states.INITIAL) {
      this.state = states.BEFORE;
    }

    //noinspection FallthroughInSwitchStatementJS
    switch (this.state) {
      case states.BEFORE:
      case states.AFTER:
        obj = module[this.state === states.BEFORE ? '_before' : '_after'][this.index];

        if (obj && typeof obj.callback === 'function') {
          this.context = obj.context;
          result = obj.callback.apply(this, this.args);
        }
        else {
          this.state = this.state === states.BEFORE ? states.BODY : states.FINISHED;
          this.index = -1;
          this.next();
        }
        break;
      case states.BODY:
        if (typeof module.body === 'function') {
          this.context = module.context;
          result = module.body.apply(this, this.args);
          this.state = states.AFTER;
          this.index = -1;
        }
        break;
      case states.FINISHED:
        this.state = states.INITIAL;
        this.index = 0;
        this.context = null;
        break;
    }

    if (this.state !== states.INITIAL) {
      if (result === false) {
        this.stop();
      }
      else if (result) {
        this.next();
      }
    }

    return this;
  }
};

DM = (function(options) {
  var _modules,
    _engine,
    UNDEFINED = 'undefined';

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

  _modules = {};

  return {
    add : function(name, callback, context) {
      var module = getModule(name);
      if (module) {
        if (typeof module.body === 'function') {
          throw new Error('Module(' + name + ') body callback is already defined');
        }
        else {
          module.body = callback;
        }
      }
      createModule(name, callback, context);

      return this;
    },
    before : function(name, callback, context, weight) {
      var module = getModule(name) || createModule(name);

      if (typeof callback !== 'function') {
        throw new Error('Callback should be a function');
      }

      module.before(callback, context, weight);

      return this;
    },
    after : function(name, callback, context, weight) {
      var module = getModule(name) || createModule(name);

      if (typeof callback !== 'function') {
        throw new Error('Callback should be a function');
      }

      module.after(callback, context, weight);

      return this;
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

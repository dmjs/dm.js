var DM;

function DMModule(callback, context) {
  this.body = callback;
  this.bodyContext = context;
}

DMModule.STATES = {
  INITIAL  : 0,
  BEFORE   : 1,
  BODY     : 2,
  AFTER    : 3,
  FINISHED : 4
};

DMModule.TYPES = {
  CONTINUE : 'continue',
  STOP     : 'stop'
};

DMModule.prototype = {
  constructor : DMModule,
  _before     : [],
  _after      : [],
  context     : null,
  body        : null,
  bodyContext : null,
  state       : 0,
  index       : 0,
  sorted      : false,
  _sort       : function(arr) {
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
  },
  before   : function(callback, context, weight){
    this.sorted = false;

    this._before.push({
      callback : callback,
      context  : context,
      weight   : weight || 0
    });

    return this;
  },
  after    : function(callback, context, weight){
    this.sorted = false;

    this._after.push({
      callback : callback,
      context  : context,
      weight   : weight || 0
    });

    return this;
  },
  /**
   * @param {Array} args
   * @param {String} type
   * @returns {*}
   */
  execute  : function(args, type){
    var states = DMModule.STATES,
      types = DMModule.TYPES,
      obj,
      result;

    if (!this.sorted) {
      this._sort(this._after);
      this._sort(this._before);
      this.sorted = true;
    }

    switch (type) {
      case types.CONTINUE:

        break;
    }

    if (type === types.CONTINUE && this.state === states.INITIAL) {
      //do nothing when continue executed in INITIAL state
      return;
    }

    //noinspection FallthroughInSwitchStatementJS
    switch(this.state) {
      case states.INITIAL:
        this.state = states.BEFORE;
      case states.BEFORE:
        obj = this._before[this.index];
        if (obj && typeof obj.callback === 'function') {
          this.context = obj.context;
          result = obj.callback.apply(this, args);
        }
        else {
          this.state = states.BODY;
          this.index = 0;
          this.continue(args);
        }
        break;
      case states.BODY:
        if (typeof this.body === 'function') {
          this.context = this.bodyContext;
          this.body.apply(this, args);
          this.state = states.AFTER;
          this.index = -1;
          result = true;
        }
        break;
      case states.AFTER:
        obj = this._after[this.index];
        if (obj && typeof obj.callback === 'function') {
          this.context = obj.context;
          result = obj.callback.apply(this, args);
        }
        else {
          this.state = states.FINISHED;
          this.index = 0;
          this.continue(args);
        }
        break;
      case states.FINISHED:
        this.state = DMModule.STATES.INITIAL;
        break;
    }

    switch(result) {
      case true:
        this.continue(args);
        break;
      case false:
        this.stop(args);
        break;
    }

    return this;
  },
  continue : function(args){
    this.index++;
    this.execute(args, DMModule.TYPES.CONTINUE);
  },
  stop     : function(args){
    this.index = 0;
    this.state = DMModule.STATES.FINISHED;
    this.execute(args, DMModule.TYPES.STOP);
  }
};

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
        callback.call(context, obj[i], i);
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
    return DMUtils.map(node.getAttribute('data-marker').match(/([a-z\-]+(\[[^[]+\])?)/ig), function(str) {
      var parts = str.match(/[^\[\]]+/ig),
        name, args;

      name = parts.shift();

      parts.unshift(node);

      args = parts[1] ? DMUtils.map(parts[1].split(','), DMUtils.trim) : [];

      args.unshift(node);

      return {
        name : name,
        args : args
      };
    });
  },
  filterModules : function(modules) {
    return modules.filter(function() {
      //provide initialized save mechanism
      return true;
    });
  }
};


DM = (function(options) {
  var _modules,
    UNDEFINED = 'undefined';

  /**
   * Create new {DMModule} instance
   * @param {string} name
   * @param {Function?} callback
   * @param {Object?} context
   * @returns {DMModule}
   */
  function createModule(name, callback, context) {
    return new DMModule(callback, context);
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
      if (getModule(name)) {
        throw new Error('Module `' + name + '` is already defined');
      }
      _modules[name] = createModule(name, callback, context);

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
      //find nodes
      var nodes = DMUtils.all('[data-marker]');

      DMUtils.each(Array.prototype.slice.call(nodes), function(node) {
        var modules = DMUtils.getModules(node);

        modules = DMUtils.filterModules(modules);

        DMUtils.each(modules, function(data) {
          console.log(data);

          var module = getModule(data.name);

          if (module) {
            module.execute(data.args);
          }
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

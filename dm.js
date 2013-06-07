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
   *
   * @param {String} type
   * @returns {*}
   */
  execute  : function(type){
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
          result = obj.callback.apply(this);
        }
        else {
          this.state = states.BODY;
          this.index = 0;
          this.continue();
        }
        break;
      case states.BODY:
        if (typeof this.body === 'function') {
          this.context = this.bodyContext;
          this.body.apply(this);
          this.state = states.AFTER;
          this.index = -1;
          result = true;
        }
        break;
      case states.AFTER:
        obj = this._after[this.index];
        if (obj && typeof obj.callback === 'function') {
          this.context = obj.context;
          result = obj.callback.apply(this);
        }
        else {
          this.state = states.FINISHED;
          this.index = 0;
          this.continue();
        }
        break;
      case states.FINISHED:
        this.state = DMModule.STATES.INITIAL;
        break;
    }

    switch(result) {
      case true:
        this.continue();
        break;
      case false:
        this.stop();
        break;
    }

    return this;
  },
  continue : function(){
    this.index++;
    this.execute(DMModule.TYPES.CONTINUE);
  },
  stop     : function(){
    this.index = 0;
    this.state = DMModule.STATES.FINISHED;
    this.execute(DMModule.TYPES.STOP);
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
      DMUtils.each(_modules, function(module) {
        module.execute();
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

/**
 * DOM Markers
 *
 * @module dm
 */

//TODO - outer dependencies support (addDep, removeDep, getDep)
//TODO - implement registry retrieving (for debug)
var DMUtils = {
    /**
     * Each utility function
     * @param {Object} obj
     * @param {Function} callback
     * @param {Object?} context
     */
    each : function(obj, callback, context){
        var i;

        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                callback.call(context, obj[i], i, obj);
            }
        }
    },

    /**
     * Map utility function
     * @param {Array} arr
     * @param {Function} callback
     * @param {*?} context
     * @returns {*}
     */
    map : function(arr, callback, context){
        return arr.map(callback, context);
    },

    /**
     * @param {String} selector
     * @param {Element|HTMLDocument|?} ctx
     * @returns {NodeList}
     */
    all : function(selector, ctx){
        if (!(ctx instanceof Element || ctx instanceof HTMLDocument)) {
            ctx = document;
        }

        return ctx.querySelectorAll(selector);
    },

    /**
     * Trim
     * @param {string} str
     * @returns {string}
     */
    trim : function(str){
        return str.trim();
    },

    /**
     *
     * @param {Element} node
     * @param {string} attrName
     * @return {Array.<{name:String,args:Array}>}
     */
    getModules : function(node, attrName){
        return DMUtils.map(node.getAttribute(attrName).match(/([a-zA-Z][a-zA-Z\-0-9]*(\[[^[]+\])?)/ig) || [], function(str){
            var parts = str.match(/[^\[\]]+/ig),
                name,
                args;

            name = parts.shift();
            //todo - parse json hash
            args = parts[0] ? DMUtils.map(parts[0].split(','), DMUtils.trim) : [];

            //convert arguments to native types
            DMUtils.each(args, function(value, key, data){
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

    /**
     * Filter utility function
     * @param arr
     * @param callback
     * @returns {*}
     */
    filter : function(arr, callback){
        return arr.filter(callback);
    },

    /**
     * Filter modules (exclude already executed on node)
     * @param {Element} node
     * @param {Array} list
     * @param {Object} modules
     * @returns {*}
     */
    filterModules : function(node, list, modules){
        return DMUtils.filter(list, function(module){
            var _data = node._dm || (node._dm = {}),
                uuid,
                result = false;

            //should set result to true, if module where not processed for this node
            uuid = modules[module.name] && modules[module.name].uuid;

            if (!_data[uuid]) {
                result = _data[uuid] = true;
            }

            return result;
        });
    },

    updateNodeState : function(node, module, modules, state){
        var data,
            uuid,
            result;

        data = node._dm || (node._dm = {});
        uuid = modules[module.name] && modules[module.name].uuid;

        result = data[uuid] || 1;

        data[uuid] = state || result;

        /*if (module.name === 'B') {
         debugger;
         }*/

        return result !== state;
    },

    shouldProcessNode : function(node, module, modules){
        var data,
            uuid,
            result;

        data = node._dm || (node._dm = {});
        uuid = modules[module.name] && modules[module.name].uuid;

        if (!data[uuid]) {
            result = data[uuid] = 1;
        }
        else {
            result = data[uuid];
        }

        return result;
    },

    /*    isEmpty : function(object) {
     var i;//todo - probably should use some other way here
     for(i in object) {
     if (object.hasOwnProperty(i)) {
     return false;
     }
     }
     return true;
     },*/

    keysCount : function(object){
        var i;//todo - probably should use some other way here
        for (i in object) {
            if (object.hasOwnProperty(i)) {
                i++;
            }
        }
        return i;
    },

    /**
     * InSort sorting implementation
     * @note Used cause of unstable native algorithm of Chrome
     * @param {Function?} fn
     * @returns {Array}
     */
    inSort : function inSort(fn){
        var i, n, j, key;
        for (i = 1, n = this.length; i < n; i++) {
            key = this[i];
            j = i - 1;

            while (j >= 0 && fn ? fn(this[j], key) > 0 : this[j] > key) {
                this[j + 1] = this[j];
                j = j - 1;
            }

            this[j + 1] = key
        }
        return this;
    },

    /**
     * Return new unique id
     * @returns {Function}
     */
    uuid : (function(){
        var uuid = 0;
        return function(){
            return ++uuid;
        };
    })()
};

/**
 * Module constructor
 *
 * @param {string} name - name of the module
 * @param {Function?} callback - main module callback
 * @param {Array.<string>?} dependency - an array of modules names from which this depends
 * @constructor
 * @class DMModule
 */
function DMModule(name, callback, dependency){
    this.uuid = DMUtils.uuid();
    this.name = name;
    this.ready = false;
    this.data = {};

    this._dependency = [];
    this._before = [];
    this._after = [];
    this._instances = [];
    this._add = callback;

    DMUtils.each(dependency, function(name){
        this._dependency.push({
            name      : name,
            data      : null,
            instances : []
        });
    }, this);
}

/**
 * Sort module
 *
 * @param {Array} arr
 * @returns {DMModule}
 * @private
 * @method _sort
 * @chainable
 */
DMModule.prototype._sort = function(arr){
    arr.sort(function(a, b){
        var result;

        if (a.weight === b.weight) {
            result = 0;//todo - check that the native sort works correctly when arr.length > 10
        }
        else {
            result = a.weight > b.weight ? 1 : -1;
        }

        return result;
    });
    return this;
};

/**
 * Preparation method (before execution)
 *
 * @returns {this}
 * @private
 * @method _prepare
 * @chainable
 */
DMModule.prototype._prepare = function(){
    this._sort(this._before)._sort(this._after);
    this.ready = true;
    return this;
};

/**
 * Add `_before` callback to module
 *
 * Used by `DM.before`
 *
 * **internal use only**
 *
 * @param {Function} callback
 * @param {Number?} weight
 * @returns {Number}
 * @protected
 * @method before
 */
DMModule.prototype.before = function(callback, weight){
    var id = DMUtils.uuid();

    this.ready = false;

    this._before.push({
        callback : callback,
        weight   : weight || 0,
        uuid     : id
    });

    return id;
};

/**
 * Add `_after` callback to module
 *
 * Used by `DM.after`
 *
 * **internal use only**
 *
 * @param {Function} callback
 * @param {Number?} weight
 * @returns {Number}
 * @protected
 * @method after
 */
DMModule.prototype.after = function(callback, weight){
    var id = DMUtils.uuid();

    this.ready = false;

    this._after.push({
        callback : callback,
        weight   : weight || 0,
        uuid     : id
    });

    return id;
};

/**
 * Constructor of execution manager
 *
 * Used as `this` context for the all `(add, before, after)` execution callbacks
 *
 * @param {DMModule} module
 * @param {Object} inst - {node:Element, args:Array, data: *}
 * @param {Function} finish - execution finish callback
 * @constructor
 * @class DMExec
 */
function DMExec(module, inst, finish){
    this.module = module;
    this.node = inst.node;
    this.args = inst.args;
    this.data = inst.data;

    this._state = 0;
    this._index = 0;
    this._waiting = null;
    this._finish = finish;
    this._timer = null;

    this._execute();
}

/**
 * Internal execution states;
 *
 * **internal use only**
 *
 * - `INITIAL` - initial state
 * - `BEFORE` - execution of _before_ callbacks
 * - `MAIN` - execution of _add_ callback
 * - `AFTER` - execution of _after_ callbacks
 * - `FINISHED` - finished state
 *
 * @type {{INITIAL: number, BEFORE: number, MAIN: number, AFTER: number, FINISHED: number}}
 * @property STATES
 * @static
 */
DMExec.STATES = {
    INITIAL  : 0,
    BEFORE   : 1,
    MAIN     : 2,
    AFTER    : 3,
    FINISHED : 4
};

/**
 * Execution types
 *
 * **internal use only**
 *
 * @type {{NEXT: string, STOP: string}}
 * @property TYPES
 * @static
 */
DMExec.TYPES = {
    NEXT : 'next',
    STOP : 'stop'
};

/**
 * Force current execution manager instance to execute next callback
 *
 * @method next
 */
DMExec.prototype.next = function(){
    if (this._waiting) {
        this._waiting = false;
        clearTimeout(this._timer);
    }
    this._index++;
    this._execute(DMExec.TYPES.NEXT);
    //todo - should we stop any other code below the next call ?
};
/**
 * Stops current execution
 *
 * @method stop
 */
DMExec.prototype.stop = function(){
    if (this._waiting) {
        this._waiting = false;
        clearTimeout(this._timer);
    }
    this._index = 0;
    this._state = DMExec.STATES.FINISHED;
    this._execute(DMExec.TYPES.STOP);
};
/**
 * Proceed callback execution
 *
 * **internal use only**
 *
 * @param {String?} type
 * @method _execute
 * @returns {DMExec}
 * @protected
 */
DMExec.prototype._execute = function(type){
    var states = DMExec.STATES,
        types = DMExec.TYPES,
        module = this.module,
        obj;

    if (!(type === types.NEXT && this._state === states.INITIAL)) {
        if (!module.ready) {
            module._prepare();
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
                obj.callback.apply(this, this.args);
            }
            else {
                this._state = this._state === states.BEFORE ? states.MAIN : states.FINISHED;
                this._index = -1;
            }
            break;
        case states.MAIN:
            //the 2 lines of code below fix isn't so actually good.
            this._state = states.AFTER;
            this._index = -1;
            //todo - should provide correct state & index properties inside current execution context
            if (typeof module._add === 'function') {
                module._add.apply(this, this.args);
            }
            break;
        case states.FINISHED:
            this._state = states.INITIAL;
            this._index = 0;

            if (typeof this._finish === 'function') {
                this._finish.call(this);
            }
            break;
        default:
    }

    if (this._state !== states.INITIAL && !this._waiting) {
        this.next();
    }

    return this;
};

/**
 * Initiate execution timeout
 *
 * @param {number?} timeout - wait timeout in ms; `default: 5000`
 * @param {boolean?} stop - will abort execution if timeout reached & value is true; `default: false`
 * @method wait
 */
DMExec.prototype.wait = function(timeout, stop){
    var self = this;

    this._waiting = true;

    this._timer = setTimeout(function(){
        self[stop ? 'stop' : 'next']();
    }, timeout || 5000);
};

/**
 * Return children elements data
 *
 * Structure:
 *
 *     Object {
 *         module_name : Array.<
 *             {
 *                 node : Element
 *                 args : Array
 *             }
 *         >,
 *         ...
 *     }
 *
 * @returns {Object}
 * @method children
 */
DMExec.prototype.children = function(){
    //todo - should accept role
    //todo - should cache
    var attrName,
        nodes,
        result = {};

    attrName = DM.config('prefix') + this.module.name;
    nodes = DMUtils.all('[' + attrName + ']', this.node);

    DMUtils.each(Array.prototype.slice.call(nodes), function(node){
        DMUtils.each(DMUtils.getModules(node, attrName), function(module){
            if (!result[module.name]) {
                result[module.name] = [];
            }
            result[module.name].push({
                node : node,
                args : module.args
            });
        });
    }, this);

    return result;
};

/**
 * Return dependency information
 *
 * Structure:
 *
 *     Object {
 *         name : String - name of the module
 *         data : * - Global (per module) execution context (mixed data)
 *         instances: Array.<
 *             {
 *                 node : Element
 *                 args : Array
 *                 data : *
 *             }
 *         >
 *     }
 *
 *
 * @param {string} name
 * @returns {Object?}
 * @method dependency
 */
DMExec.prototype.dependency = function(name){
    var i, l, dependencies, result;

    dependencies = this.module._dependency;

    for (i = 0, l = dependencies.length; i < l; i++) {
        if (dependencies[i].name === name) {
            result = dependencies[i];
            break;
        }
    }
    return result;
};

/**
 * Main library wrapper
 *
 * @class DM
 */
var DM = (function(options){
    var _modules = {},
        _engine,
        _bind = {},
        _config_default = {
            attr   : 'data-marker',
            prefix : 'data-'
        },
        _config = {
            attr   : _config_default.attr,
            prefix : _config_default.prefix
        };

    function initEngine(callback){
        if (!_engine) {
            if (options.engines.y) {
                //_engine = options.engines.y;
                options.engines.y().use('node-base', 'array-extras', function(Y){
                    DMUtils.all = function(selector, ctx){
                        return (ctx ? Y.one(ctx) : Y).all(selector).getDOMNodes();
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
                    //todo - use context
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
     * @param {Array.<string>?} dependency
     * @returns {DMModule}
     */
    function createModule(name, callback, dependency){
        return _modules[name] = new DMModule(name, callback, dependency);
    }

    /**
     * Get existing module or false
     * @param {String} name
     * @returns {DMModule|Boolean}
     */
    function getModule(name){
        var module = _modules[name];

        //todo - thrown an error if module was not found

        return module instanceof DMModule ? module : false;
    }

    function onFinish(dependencies, listener){
        DMUtils.each(dependencies, function(dep){
            if (!_bind[dep.name]) {
                _bind[dep.name] = {}
            }
            _bind[dep.name][listener.name] = listener;
        });
    }

    function executeModule(module, cb){
        var i = 0, c = module._instances.length;

        function finish(){
            if (i >= c) {
                cb.call(module);
            }
        }

        DMUtils.each(module._instances, function(inst){
            if (DMUtils.updateNodeState(inst.node, module, _modules, 2)) {
                //update dependencies
                DMUtils.each(module._dependency, function(dep){
                    var mod = getModule(dep.name);
                    dep.instances = mod._instances;
                    dep.data = mod.data;
                });

                i++;

                new DMExec(module, inst, finish);
            }
        });
    }

    return {
        /**
         * Declare DM module
         *
         * @param {String} name - name of the module
         * @param {Function?} callback - the module body function
         * @param {Array.<string>?} dependency - an array of modules names from which this depends
         * @returns {Number} - UUID of the callback
         * @static
         * @method add
         * @throws Error - if the module already declared
         */
        add : function(name, callback, dependency){
            var module = getModule(name);
            if (module) {
                if (typeof module._add === 'function') {
                    throw new Error('Module(' + name + ') main callback is already defined');
                }
                else {
                    module._add = callback;
                }
            }
            else {
                module = createModule(name, callback, dependency);
            }

            return module.uuid;
        },

        /**
         * Declare the callback preceding the module body function
         *
         * If the module weren't created by `DM.add`: new module (without the body) will be created implicitly
         *
         * @param {String} name - name of the module
         * @param {Function} callback - the module preceding function
         * @param {Number?} weight - the weight of the callback (lower have the higher priority)
         * @returns {Number} - UUID of the callback
         * @static
         * @method before
         * @throws Error - if the callback attribute is not a function
         */
        before : function(name, callback, weight){
            var module = getModule(name) || createModule(name);

            if (typeof callback !== 'function') {
                throw new Error('Callback should be a function');
            }

            return module.before(callback, weight);
        },

        /**
         * Declare the callback succeeding the module body function
         *
         * @param {String} name - name of the module
         * @param {Function} callback - the module succeeding function
         * @param {Number?} weight - the weight of the callback (lower have the higher priority)
         * @returns {Number} - UUID of the callback
         * @static
         * @method after
         * @throws Error - if the callback attribute is not a function
         */
        after : function(name, callback, weight){
            var module = getModule(name) || createModule(name);

            if (typeof callback !== 'function') {
                throw new Error('Callback should be a function');
            }

            return module.after(callback, weight);
        },

        /**
         * Initiate callbacks execution
         *
         * @returns {DM}
         * @static
         * @method go
         * @chainable
         */
        go : function(){
            //todo - should accept & execute only asked module(s): Array.<string>
            initEngine(function(){
                var ATTR = DM.config('attr'),
                    nodes = DMUtils.all('[' + ATTR + ']', options.env.document);

                DMUtils.each(Array.prototype.slice.call(nodes), function(node){
                    var modules = DMUtils.getModules(node, ATTR);

                    DMUtils.each(modules, function(data){
                        var module = getModule(data.name);
                        if (module && DMUtils.updateNodeState(node, module, _modules)) {
                            module._instances.push({
                                node : node,
                                args : data.args,
                                data : {}
                            });
                        }
                    });
                });

                var executed = [];

                var finishCallback = function(){
                    executed.push(this.name);

                    if (_bind[this.name]) {
                        DMUtils.each(_bind[this.name], function(module){
                            var ec = 0;

                            DMUtils.each(module._dependency, function(dep){
                                if (~executed.indexOf(dep.name)) {
                                    ec++;
                                }
                            });

                            if (module._dependency.length === ec) {
                                executeModule(module, finishCallback);
                            }

                            _bind[this.name] = null;
                            delete _bind[this.name];
                        }, this);
                    }
                };

                DMUtils.each(_modules, function(module){
                    if (module._dependency.length === 0) {
                        executeModule(module, finishCallback);
                    }
                    else {
                        onFinish(module._dependency, module);
                    }
                });
            });
            return this;
        },

        /**
         * Detach the callback
         *
         * @param {Number} uuid - UUID of the callback
         * @return {DM}
         * @static
         * @method detach
         * @chainable
         */
        detach : function(uuid){
            var name,
                i,
                obj,
                module,
                found = false;

            //check all the modules
            //try to find uuid in module or inside the before/afters
            for (name in _modules) {
                if (_modules.hasOwnProperty(name)) {
                    module = _modules[name];

                    if (module.uuid === uuid) {
                        //remove _add c/c
                        module._add = null;
                        found = true;
                    }
                    else {
                        for (i in module._before) {
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
                            for (i in module._after) {
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
         * Remove module from registry
         *
         * @param {string} name - module name
         * @return {DM}
         * @static
         * @method remove
         * @chainable
         */
        remove : function(name){
            if (_modules[name]) {
                delete _modules[name];
            }
            return this;
        },

        /**
         * Remove all modules from registry
         *
         * @returns {DM}
         * @static
         * @method removeAll
         * @chainable
         */
        removeAll : function(){
            _modules = {};
            return this;
        },

        /**
         * Configuration getter/getter
         *
         * Currently available configuration keys: attr, prefix
         *
         * - Getting the current value, call this with the only one string parameter:
         *   _name_ of the configuration property
         * - Set the single value `DM.config(string_name, string_value)`
         * - Set any number of values `DM.config(Object.<key:value>)`
         *
         * @param {string|Object} cfg
         * @param {string?} value
         * @returns {string?} - current configuration value (`DM.config(string_value)
         * @static
         * @method config
         */
        config : function(cfg, value){
            var result, i;

            if (typeof cfg === 'string') {
                if (cfg in _config) {
                    if (typeof value === 'string') {
                        _config[cfg] = value;
                    }
                    else {
                        result = _config[cfg];
                    }
                }
            }
            else if (typeof cfg === 'object') {
                for (i in cfg) {
                    if (cfg.hasOwnProperty(i) && i in _config && typeof cfg[i] === 'string') {
                        _config[i] = cfg[i];
                    }
                }
            }

            return result;
        },

        /**
         * Revert inner configuration to default values
         *
         * @returns {DM}
         * @static
         * @method resetConfig
         * @chainable
         */
        resetConfig : function(){
            _config = {
                attr   : _config_default.attr,
                prefix : _config_default.prefix
            };

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

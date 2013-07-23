/*
 * DOM Markers 0.3.0
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
    each          : function(obj, callback, context){
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
    map           : function(arr, callback, context){
        return arr.map(callback, context);
    },
    /**
     * @param {String} selector
     * @param {Element|HTMLDocument|?} ctx
     * @returns {NodeList}
     */
    all           : function(selector, ctx){
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
    trim          : function(str){
        return str.trim();
    },
    /**
     *
     * @param {Element} node
     * @param {string} attrName
     * @return {Array.<{name:String,args:Array}>}
     */
    getModules    : function(node, attrName){
        return DMUtils.map(node.getAttribute(attrName).match(/([a-z\-]+(\[[^[]+\])?)/ig) || [], function(str){
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
    filter        : function(arr, callback){
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
    updateNodeState : function(node, module, modules, state) {
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
    keysCount : function(object) {
        var i;//todo - probably should use some other way here
        for(i in object) {
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
    inSort : function inSort(fn) {
        var i, n, j, key;
        for (i = 1, n = this.length; i < n; i++) {
            key = this[i]
            j = i - 1;

            while (j >= 0 && fn ? fn(this[j], key) > 0 : this[j] > key) {
                this[j + 1] = this[j]
                j = j - 1
            }

            this[j + 1] = key
        }
        return this;
    },
    /**
     * Return new unique id
     * @returns {Function}
     */
    uuid          : (function(){
        var uuid = 0;
        return function(){
            return ++uuid;
        };
    })()
};

/**
 * @param {string} name
 * @param {Function?} callback
 * @param {*?} context
 * @constructor
 */
function DMModule(name, callback, context, dependency){
    this.uuid = DMUtils.uuid();

    this._dependency = [];
    this._before = [];
    this._after = [];
    this._instances = [];
    this._add = {
        callback : callback,
        context  : context
    };
    this.name = name;
    this.ready = false;

    DMUtils.each(dependency, function(name) {
        this._dependency.push({
            name      : name,
            context   : null,
            instances : []
        });
    }, this);
}

/**
 * Sort module
 * @param {Array} arr
 * @returns {this}
 * @private
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
 * Preparation method
 * - Sort the callbacks
 * @returns {this}
 */
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

/**
 * DMExec
 * Execution constructor; Manage callbacks execution
 * @param module
 * @param node
 * @param args
 * @param finish
 * @constructor
 */
function DMExec(module, node, args, finish){
    this.module = module;
    this.node = node;
    this.args = args;

    this._state = 0;
    this._index = 0;
    this.context = null;
    this._waiting = null;
    this._finish = finish;
    this._timer = null;
}

/**
 * Execution states
 * @type {{INITIAL: number, BEFORE: number, MAIN: number, AFTER: number, FINISHED: number}}
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
 * @type {{NEXT: string, STOP: string}}
 */
DMExec.TYPES = {
    NEXT : 'next',
    STOP : 'stop'
};

/**
 * Force current execution manager instance to execute next callback
 */
DMExec.prototype.next = function(){
    if (this._waiting) {
        this._waiting = false;
        clearTimeout(this._timer);
    }
    this._index++;
    this.execute(DMExec.TYPES.NEXT);
    //todo - should we stop any other code below the next call ?
};
/**
 * Stops current execution
 */
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
 * Proceed callback execution
 * @param {String?} type
 * @returns {DMExec}
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
            }
            break;
        case states.MAIN:
            //the 2 lines of code below fix isn't so actually good.
            this._state = states.AFTER;
            this._index = -1;
            //todo - should provide correct state & index properties inside current execution context
            if (typeof module._add.callback === 'function') {
                this.context = module._add.context;
                module._add.callback.apply(this, this.args);
            }
            break;
        case states.FINISHED:
            this._state = states.INITIAL;
            this._index = 0;
            this.context = null;

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
 * Initiate timeout
 * @param {number?} timeout - wait timeout in ms; default: 5000
 * @param {boolean?} stop - will abort execution if timeout reached & value is true; default: false
 */
DMExec.prototype.wait = function(timeout, stop){
    var self = this;

    this._waiting = true;

    this._timer = setTimeout(function(){
        self[stop ? 'stop' : 'next']();
    }, timeout || 5000);
};

/**
 * @returns {*}
 */
DMExec.prototype.children = function(){
    //todo - should accept role
    //todo - should cache
    //todo - cover with tests
    var attrName,
        nodes,
        result = {};

    attrName = 'data-' + this.module.name;
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

DMExec.prototype.dependency = function(name){
    //return this.module._dependency[name];
    throw new Error('omg!!!');
};

/**
 * Singleton; Main library wrapper;
 *
 * {{add:Function,before:Function,after:Function,go:Function,detach:Function,remove:Function,removeAll:Function}}
 */
DM = (function(options){
    var _modules = {},
        _engine,
        _bind = {};

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
    function createModule(name, callback, context, dependency){
        return _modules[name] = new DMModule(name, callback, context, dependency);
    }

    /**
     * Get existing module or false
     * @param {String} name
     * @returns {DMModule|Boolean}
     */
    function getModule(name){
        var module = _modules[name]

        //todo - thrown an error if module was not found

        return module instanceof DMModule ? module : false;
    }

    function onFinish(deps, listener) {
        DMUtils.each(deps, function(dep) {
            if (!_bind[dep.name]) {
                _bind[dep.name] = {}
            }
            _bind[dep.name][listener.name] = listener;
        });
    }

    function executeModule(module, ctx, cb) {
        DMUtils.each(module._instances, function(inst) {
            //if (DMUtils.updateNodeState(inst.node, module, _modules, 2)) {
                (new DMExec(module, inst.node, inst.data.args, cb)).execute();

                if (ctx) {
                    /*ctx.instances.push({
                        node : inst.node,
                        args : inst.data.args
                    });*/
                }
            //}
        });
    }

    return {
        /**
         *
         * @param {String} name
         * @param {Function?} callback
         * @param {*?} context
         * @returns {Number}
         */
        add       : function(name, callback, context, dependency){
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
                module = createModule(name, callback, context, dependency);
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
        before    : function(name, callback, context, weight){
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
        after     : function(name, callback, context, weight){
            var module = getModule(name) || createModule(name);

            if (typeof callback !== 'function') {
                throw new Error('Callback should be a function');
            }

            return module.after(callback, context, weight);
        },
        /**
         * Initiate callbacks execution
         * @returns {DM}
         */
        go        : function(){
            //todo - should accept & execute only asked module(s): Array.<string>
            initEngine(function(){
                var nodes = DMUtils.all('[data-marker]', options.env.document);

                DMUtils.each(Array.prototype.slice.call(nodes), function(node){
                    var modules = DMUtils.getModules(node, 'data-marker');

                    DMUtils.each(modules, function(data){
                        var module = getModule(data.name);

                        if (module && DMUtils.updateNodeState(node, module, _modules)) {
                            module._instances.push({
                                node : node,
                                data : data
                            });
                        }
                    });
                });

                var executed = [];

                var finishCallback = function() {
                    executed.push(this.module.name);

                    if (_bind[this.module.name]) {
                        DMUtils.each(_bind[this.module.name], function(module, name){
                            var ec = 0;

                            DMUtils.each(module._dependency, function(dep){
                                if (~executed.indexOf(dep.name)) {
                                    ec++;
                                }
                            });

                            if (module._dependency.length === ec) {
                                executeModule(module, {}, finishCallback);
                            }
                        });
                    }
                };

                DMUtils.each(_modules, function(module) {
                    if (module._dependency.length === 0) {
                        executeModule(module, {}, finishCallback);
                    }
                    else {
                        onFinish(module._dependency, module);
                    }
                });
            });
            return this;
        },
        /**
         * @param {Number} uuid
         * @return {DMExec}
         */
        detach    : function(uuid){
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
                        module._add.context = null;
                        module._add.callback = null;
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
         * Remove module from DM
         * @param name
         * @returns {DM}
         */
        remove    : function(name){
            if (_modules[name]) {
                delete _modules[name];
            }
            return this;
        },
        /**
         * Remove all modules from DM registry
         * @returns {DM}
         */
        removeAll : function(){
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

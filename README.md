#DOM markers

Gives the simple website development workflow.

This will allows you do not use CSS selectors to find the elements.

##Example

    <!doctype html>
    <html>
    <body>
    <h1 data-marker="color[green],size[50px]">Hello cruel world</h1>
    <script src="../dm.js"></script>
    <script>
      DM.add('color', function(value) {
        this.node.style.color = value;
      });

      DM.add('size', function(value) {
        this.node.style.fontSize = value;
      });

      DM.go();
    </script>
    </body>
    </html>


##Quick start

Three options are available:

* [Download the latest release][release]
* Clone the repo: `git clone git@github.com:jslayer/dm.js.git`
* Install with [Bower][bower]: `bower install dm`

##Demos

Checkout the [Demos][demos]

##Specs

`dm.js` add `DM` object into the global scope. Here is its main methods:

###add

Define the module. It have 3 arguments:

* {String} module name
* {Function} module callback - each module can have only on main callback
* {Any} optional context; default - `undefined`

<pre>
    DM.add('moduleName', function(/*will take arguments from the DOM element*/) {
        /*Your code goes here*/
    }, {module:'context'});
</pre>

###before & after

Allows you to add pre & post processing callbacks.

Accept 4 arguments:

* {String} module name
* {Function} pre/post process callback
* {Any} optional context; default - `undefined`
* {Number} optional weight; default - `0`; Lower values have a higher priority

<pre>
    DM.before('moduleName', function(/*will take arguments from the DOM element*/) {
        /*Your code goes here*/
    }, {module:'context'});
</pre>

###go

Will execute all the defined "modules".

Example:

    DM.go()

##Workflow

* Callbacks execution starts with `DM.go()`
* DM finds all the DOM Elements which have `data-markers` attribute
* Parse the attribute values. It might have
    * the list of modules separated by commas : `data-marker="moduleOne, moduleTwo"`
    * the arguments for a callbacks: `data-marker="moduleName[value1,value2]"`
* If the listed modules is defined with `add`/`before`/`after`, then a new instance of execution(`DMExec`) object
  will be created for each module & DOM element;
* This (DMExec) instance manage callbacks execution order:
    * `before` definitions
    * main (defined with `add`) module definition callback
    * `after` definitions
* The callback have this instance as context, so it could be accessed with `this` keyword
* Each callback should return `true` to immediately transfer control to the next callbacks
* If any callback return `false`, this will immediately stops the execution of the current instance
* Also, you can control the execution process by calling `this.next()` & `this.stop()` methods
  It will allows you to proceed/stop execution after some long actions
* Each module will be processed for each DOM element only once

##DMExec object properies & method

* `args` - array of the arguments
* `context` - will have the current execution (one of before/add/after) context
* `node` - target DOM Element
* `state` & `index` - internal properties

##Release History

See the [Changelog][changelog]

##MIT Open Source License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[demos]:http://jslayer.github.io/dm.js/demo/
[changelog]:CHANGELOG.md
[release]:https://github.com/jslayer/dm.js/zipball/master
[bower]:http://bower.io/

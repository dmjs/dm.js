#DOM Markers

Gives the simple website development workflow.

This will allows you do not use CSS selectors to find the DOM elements.

##Version

Current version is: __*0.5.0*__ (in progress)

[![Build Status](https://secure.travis-ci.org/dmjs/dm.js.png?branch=master)](http://travis-ci.org/dmjs/dm.js)

##Example

    <!doctype html>
    <html>
    <body>
    <!-- bind markup data -->
    <h1 data-marker="color[green],size[50px]">Hello cruel world</h1>
    <script src="../dm.js"></script>
    <script>
        // Declare your modules
        DM.add('color', function(value) {
          this.node.style.color = value;
        });

        DM.add('size', function(value) {
          this.node.style.fontSize = value;
        });

        //Execute
        DM.go();

        //Profit!
    </script>
    </body>
    </html>


##Quick start

Three options are available:

* [Download the latest release][release]
* Clone the repo: `git clone git@github.com:dmjs/dm.js.git`
* Install with [Bower][bower]: `bower install dm.js`

##Demos

Checkout the [Demos][demos]

##API

Checkout our [Wiki pages][wiki] to see full details

##Running tests

In order to run tests makes sure that [bower][bower] is installed & you have installed dependencies (`$bower install`)

###Testing in PhantomJS

Make sure that [grover][github-grover] is installed

<pre>
$cd /path/to/library/root
$npm test
</pre>

###Testing in *normal* browsers

simply open `tests/unit/dm.html` in browser & check the output of the testing console

##Release History

See the [Changelog][changelog]

##MIT Open Source License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[demos]:http://dmjs.github.io/dm.js/demo/
[changelog]:CHANGELOG.md
[release]:https://github.com/dmjs/dm.js/zipball/master
[bower]:http://bower.io/
[github-grover]:https://github.com/yui/grover
[wiki]:https://github.com/dmjs/dm.js/wiki

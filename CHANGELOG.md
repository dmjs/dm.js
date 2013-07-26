#Changelog

## 0.4.3 (Jul 26 2013)
* changed : repository moved into https://github.com/dmjs/dm.js

## 0.4.2 (Jul 25 2013)
* add : DM.config method

## 0.4.1 (Jul 23 2013)
* fix : tests for IE 7, IE10

## 0.4.0 (Jul 23 2013)
* added : dependecies support for add method

## 0.3.0 (Jun 26 2013)
* added : basic DMExec.children() support
* added : demo/vanilla.tabs.html example

## 0.2.4 (Jun 25 2013)
* added : latest basic tests
* changed : todo

## 0.2.3 (Jun 20 2013)
* fix: the exection weren't stopped with stop() in main callback

## 0.2.2 (Jun 13 2012)
* added : package.json
* changed : [grover][github-grover] test running changed to `npm test`
* added : new tests
* added : Gruntfile.js file and uglify task
* added : minified file `dm.min.js`

## 0.2.1 (Jun 13 2013)
* changed : since now, you can execute newly created (after removing) module with the same name as of previously applied

## 0.2.0 (Jun 13 2013)
* changed: the modules worlflow. DMExec doesn't look at the callback return value since now
* changed : `before/after/add` now returns the uuid of the callback;
* added : `DMExec.wait([timeout],[stop = false])`
* change : names of some internal DMExec properties
* added : `DM.detach([before/after/add uuid])`
* added : `DM.remove(name)`
* added : `DM.removeAll()`

## 0.1.1 (Jun 11 2013)
* changed: [README][readme]
* changed: demos

[readme]:README.md
[github-grover]:https://github.com/yui/grover

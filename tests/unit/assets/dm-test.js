YUI.add('dm-test', function (Y) {

  var Assert      = Y.Assert,
    ArrayAssert = Y.ArrayAssert;

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : Basic testing',

    setUp : function() {
      Y.one('#dump').setHTML('' +
        '<div id="node-a" data-marker="small,color[red]"></div>' +
        '<div id="node-b" data-marker="big,color[green]"></div>' +
        '<div id="node-c" data-marker="small,big,color[blue]"></div>' +
        '<div id="node-d" data-marker="big,small,color[yellow]"></div>' +
        '<div id="node-e" data-marker="color[white]"></div>'
      );

      this.nodes = {
        a : Y.one('#node-a'),
        b : Y.one('#node-b'),
        c : Y.one('#node-c'),
        d : Y.one('#node-d'),
        e : Y.one('#node-e')
      };

      DM.add('color', function(value) {
        this.node.style.color = value;
      });

      DM.add('small', function() {
        this.node.style.fontSize = '10px';
      });

      DM.add('big', function() {
        this.node.style.fontSize = '24px';
      });

      DM.go();
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },

    "color module should apply correct color values" : function() {
      Assert.areSame('red', this.nodes.a.getStyle('color'), '#node-a should have red color');
      Assert.areSame('green', this.nodes.b.getStyle('color'), '#node-b should have green color');
      Assert.areSame('blue', this.nodes.c.getStyle('color'), '#node-c should have blue color');
      Assert.areSame('yellow', this.nodes.d.getStyle('color'), '#node-d should have yellow color');
      Assert.areSame('white', this.nodes.e.getStyle('color'), '#node-e should have white color');
    },

    "`small` module should set node font-size to 10px" : function() {
      Assert.areSame('10px', this.nodes.a.getStyle('fontSize'));
    },

    "`big` module should set node font-size to 24px" : function() {
      Assert.areSame('24px', this.nodes.b.getStyle('fontSize'));
    },

    "#node-c modules order: small, big; big should be applied later" : function() {
      Assert.areSame('24px', this.nodes.c.getStyle('fontSize'));
    },

    "#node-d modules order: big, small; small should be applied later" : function() {
      Assert.areSame('10px', this.nodes.d.getStyle('fontSize'));
    }
  }));

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : Basic testing of before & after',

    setUp : function() {
      Y.one('#dump').setHTML('' +
        '<div id="node-a" data-marker="onlyBefore"></div>' +
        '<div id="node-b" data-marker="onlyAfter"></div>' +
        '<div id="node-c" data-marker="moduleWithBeforeAndAfter"></div>'
      );

      this.nodes = {
        a : Y.one('#node-a'),
        b : Y.one('#node-b'),
        c : Y.one('#node-c')
      };

      /**
       * Let's define module with only before callback
       */
      DM.before('onlyBefore', function() {
        this.node.innerHTML = 'this is before-only module';
      });

      /**
       * Let's define module with only after callback
       */
      DM.before('onlyAfter', function() {
        this.node.innerHTML = 'this is after-only module';
      });

      /**
       * Lets defined the complex module (with before/add/after callbacks)
       */
      DM.after('moduleWithBeforeAndAfter', function() {
        this.node.innerHTML += '(after)';
      });
      DM.add('moduleWithBeforeAndAfter', function() {
        this.node.innerHTML += '(add)';
      });
      DM.before('moduleWithBeforeAndAfter', function() {
        this.node.innerHTML += '(before)';
      });

      DM.go();
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },

    "`onlyBefore` module should insert HTML into target node" : function() {
      Assert.areSame('this is before-only module', this.nodes.a.getHTML());
    },

    "`onlyAfter` module should insert HTML into target node" : function() {
      Assert.areSame('this is after-only module', this.nodes.b.getHTML());
    },

    "`moduleWithBeforeAndAfter` module should insert HTML into target node" : function() {
      Assert.areSame('(before)(add)(after)', this.nodes.c.getHTML());
    }
  }));

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : Basic testing with several module callbacks',

    setUp : function() {
      Y.one('#dump').setHTML('' +
        '<div id="node-a" data-marker="batch[fontSize:21px,color:blue,backgroundColor:yellow]"></div>' +
        '<div id="node-b" data-marker="batch"></div>' +
        '<div id="node-c" data-marker="batch[htmlAfter:hello world, color:red]"></div>'
      );

      this.nodes = {
        a : Y.one('#node-a'),
        b : Y.one('#node-b'),
        c : Y.one('#node-c')
      };

      Y.one('#dump').all('[data-marker]').setStyles({
        fontSize        : '7px',
        color           : 'white',
        backgroundColor : 'black'
      });

      DM.add('batch', function() {
        this.node.innerHTML = '{batch}';
      });

      function parseArgs(arr) {
        var opts = {};
        Y.Array.each(arguments, function(item) {
          var parts = item.split(':');

          if (parts.length === 2) {
            opts[Y.Lang.trim(parts[0])] = Y.Lang.trim(parts[1]);
          }
        });

        return opts;
      }

      //handle fontSize
      DM.before('batch', function() {
        var opts = parseArgs.apply(this, arguments);

        if (opts.fontSize) {
          this.node.style.fontSize = opts.fontSize;
        }
      });

      //handle color
      DM.before('batch', function() {
        var opts = parseArgs.apply(this, arguments);

        if (opts.color) {
          this.node.style.color = opts.color;
        }
      });

      //handle backgroundColor
      DM.before('batch', function() {
        var opts = parseArgs.apply(this, arguments);

        if (opts.backgroundColor) {
          this.node.style.backgroundColor = opts.backgroundColor;
        }
      });

      //replace innerHTML of the node, on after, if htmlAfter is set
      DM.after('batch', function() {
        var opts = parseArgs.apply(this, arguments);

        if (opts.htmlAfter) {
          this.node.innerHTML = opts.htmlAfter;
        }
      });

      //set node's innerHTML to empty if there aren't any arguments
      DM.after('batch', function() {
        if (arguments.length === 0) {
          this.node.innerHTML = '{empty}';
        }
      });

      DM.go();
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },

    "#node-a should be blue/yellow 21px with '{batch}' innerHTML" : function() {
      Assert.areSame('blue', this.nodes.a.getStyle('color'), '#node-a color should be blue');
      Assert.areSame('yellow', this.nodes.a.getStyle('backgroundColor'), '#node-a backgroundColor should be yellow');
      Assert.areSame('21px', this.nodes.a.getStyle('fontSize'), '#node-a fontSize should be 21px');
      Assert.areSame('{batch}', this.nodes.a.getHTML(), '#node-a innerHTML should be "{batch}"');
    },

    "#node-b should be white/black 7px with '{empty}' innerHTML" : function() {
      Assert.areSame('white', this.nodes.b.getStyle('color'), '#node-b color should be white');
      Assert.areSame('black', this.nodes.b.getStyle('backgroundColor'), '#node-b backgroundColor should be black');
      Assert.areSame('7px', this.nodes.b.getStyle('fontSize'), '#node-b fontSize should be 7px');
      Assert.areSame('{empty}', this.nodes.b.getHTML(), '#node-b innerHTML should be "{empty}"');
    },

    "#node-c should be red/black 7px with 'hello world' innerHTML" : function() {
      Assert.areSame('red', this.nodes.c.getStyle('color'), '#node-c color should be blue');
      Assert.areSame('black', this.nodes.c.getStyle('backgroundColor'), '#node-c backgroundColor should be yellow');
      Assert.areSame('7px', this.nodes.c.getStyle('fontSize'), '#node-c fontSize should be 21px');
      Assert.areSame('hello world', this.nodes.c.getHTML(), '#node-c innerHTML should be "hello world"');
    }
  }));

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : Check module removing & overriding',

    _should : {
      error : {
        "should throw an error when trying to redefine module existing body" : 'Module(module) main callback is already defined'
      }
    },

    setUp : function() {
      Y.one('#dump').setHTML('<div id="node-a" data-marker="module">hello</div>');

      this.nodes = {
        a : Y.one('#node-a')
      };

      DM.before('module', function() {
        this.node.innerHTML = '[' + this.node.innerHTML;
      });

      DM.after('module', function() {
        this.node.innerHTML = this.node.innerHTML + '!!!';
      });

      DM.after('module', function() {
        this.node.innerHTML = this.node.innerHTML + ']';
      });

      DM.add('module', function(){
        this.node.innerHTML += ' world';
      });
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },
    "should check initial node content" : function() {
      Assert.areSame('hello', this.nodes.a.getHTML());
    },
    "should check if the 'module' works properly" : function() {
      DM.go();
      Assert.areSame('[hello world!!!]', this.nodes.a.getHTML());
    },
    "should verify that removed module will not be executed" : function() {
      DM.remove('module').go();
      Assert.areSame('hello', this.nodes.a.getHTML());
    },
    "should throw an error when trying to redefine module existing body" : function() {
      DM.add('module', function() {
        this.node.innerHTML += ' nobody';
      });
    },
    "should remove existing & create new module" : function() {
      DM.remove('module');
      DM.before('module', function() {
        this.node.innerHTML = '* ' + this.node.innerHTML;
      });

      DM.after('module', function() {
        this.node.innerHTML = this.node.innerHTML + ' *';
      });

      DM.add('module', function() {
        this.node.innerHTML += ' anyone!';
      });

      DM.go();
      Assert.areSame('* hello anyone! *', this.nodes.a.getHTML());
    },
    "should check than both existing & new module could be applied for one node" : function() {
      //this will fail in version before 0.2.1
      DM.go();
      DM.remove('module');
      DM.add('module', function() {
        //will remove all spaces from the innerHTML
        this.node.innerHTML = this.node.innerHTML.replace(/\s+/, '');
      });

      DM.before('module', function() {
        //will wrap the content with {, } signs
        this.node.innerHTML = '{' + this.node.innerHTML + '}';
      });
      DM.after('module', function() {
        //will set the fontSize to 24px
        this.node.style.fontSize = '24px';
      });

      DM.go();

      Assert.areSame('24px', this.nodes.a.getStyle('fontSize'), "fontSize should be 24px");
      Assert.areSame('{[helloworld!!!]}', this.nodes.a.getHTML());
    }
  }));

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : Check that module executed only once by node',

    setUp : function() {
      Y.one('#dump').setHTML('<div id="node-a" data-marker="foo"></div>' +
        '<div id="node-b" data-marker="bar"></div>' +
        '<div id="node-c" data-marker="foo,bar"></div>' +
        '<div id="node-d" data-marker="bar,foo"></div>' +
        '<div id="node-e" data-marker="foo,foo"></div>');

      this.nodes = {
        a : Y.one('#node-a'),
        b : Y.one('#node-b'),
        c : Y.one('#node-c'),
        d : Y.one('#node-d'),
        e : Y.one('#node-e')
      };

      DM.before('foo', function() {
        this.node.innerHTML += 'Hello ';
      });

      DM.before('foo', function() {
        this.node.innerHTML += 'Mr. ';
      });

      DM.after('foo', function() {
        this.node.innerHTML += '! :) ';
      });

      DM.add('foo', function() {
        this.node.innerHTML += 'Foo';
      });

      DM.before('bar', function() {
        this.node.innerHTML += 'Good bye ';
      });

      DM.before('bar', function() {
        this.node.innerHTML += 'Mrs. ';
      });

      DM.after('bar', function() {
        this.node.innerHTML += '! =) ';
      });

      DM.add('bar', function() {
        this.node.innerHTML += 'Bar ';
      });
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },
    "should execute modules just once and get an expected results" : function() {
      DM.go();
      Assert.areSame('Hello Mr. Foo! :) ', this.nodes.a.getHTML(), '#node-a content should be valid');
      Assert.areSame('Good bye Mrs. Bar ! =) ', this.nodes.b.getHTML(), '#node-b content should be valid');
      Assert.areSame('Hello Mr. Foo! :) Good bye Mrs. Bar ! =) ', this.nodes.c.getHTML(), '#node-c content should be valid');
      Assert.areSame('Good bye Mrs. Bar ! =) Hello Mr. Foo! :) ', this.nodes.d.getHTML(), '#node-d content should be valid');
      Assert.areSame('Hello Mr. Foo! :) ', this.nodes.e.getHTML(), '#node-e content should be valid');
    },
    "show execute modules twice and get results only of second execution" : function() {
      DM.go();
      DM.go();
      Assert.areSame('Hello Mr. Foo! :) ', this.nodes.a.getHTML(), '#node-a content should be valid');
      Assert.areSame('Good bye Mrs. Bar ! =) ', this.nodes.b.getHTML(), '#node-b content should be valid');
      Assert.areSame('Hello Mr. Foo! :) Good bye Mrs. Bar ! =) ', this.nodes.c.getHTML(), '#node-c content should be valid');
      Assert.areSame('Good bye Mrs. Bar ! =) Hello Mr. Foo! :) ', this.nodes.d.getHTML(), '#node-d content should be valid');
      Assert.areSame('Hello Mr. Foo! :) ', this.nodes.e.getHTML(), '#node-e content should be valid');
    }
  }));

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : Contexts',

    setUp : function() {
      Y.one('#dump').setHTML('<div id="node-a" data-marker="foo"></div>' +
        '<div id="node-b" data-marker="bar"></div>' +
        '<div id="node-c" data-marker="foo,bar"></div>' +
        '<div id="node-d" data-marker="bar,foo"></div>');

      this.nodes = {
        a : Y.one('#node-a'),
        b : Y.one('#node-b'),
        c : Y.one('#node-c'),
        d : Y.one('#node-d')
      };

      //Create the contexts
      this.contexts = {
        fooBefore : {foo : 'before'},
        fooMain   : {foo : 'main'},
        fooAfter  : {foo : 'after'}
      };
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },
    "should check that before/add/after are executed with correct context" : function() {
      var test = this,
        mock = new Y.Mock();

      Y.Mock.expect(mock, {
        method : 'add',
        run : function() {
          Assert.areSame(test.contexts.fooMain, this.context, 'this.context should be same as third argument of `add`');
        },
        callCount : 3 //we have 3 elements with foo data marker
      });

      Y.Mock.expect(mock, {
        method : 'before',
        run : function() {
          Assert.areSame(test.contexts.fooBefore, this.context, 'this.context should be same as third argument of `before`');
        },
        callCount : 3 //we have 3 elements with foo data marker
      });

      Y.Mock.expect(mock, {
        method : 'after',
        run : function() {
          Assert.areSame(test.contexts.fooAfter, this.context, 'this.context should be same as third argument of `after`');
        },
        callCount : 3 //we have 3 elements with foo data marker
      });

      DM.add('foo', mock.add, this.contexts.fooMain);
      DM.before('foo', mock.before, this.contexts.fooBefore);
      DM.after('foo', mock.after, this.contexts.fooAfter);

      DM.go();

      Y.Mock.verify(mock);
    }
  }));

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : Priorities',

    setUp : function() {
      Y.one('#dump').setHTML('<div id="node-a" data-marker="foo"></div>');

      this.nodes = {
        a : Y.one('#node-a')
      };
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },
    "Should check priorities" : function() {
      var test = this,
        log = {},
        mock = new Y.Mock();
      
      //create `before_m100` callback
      Y.Mock.expect(mock, {
        method : 'before_m100',
        run : function() {
          //this should be executed at very start
          Assert.isUndefined(log.before_m100, '`before_m100` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.before_m10, '`before_m10` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.before_0, '`before_0` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.before, '`before` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.before_p10, '`before_p10` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.before_p100, '`before_p100` callback SHOULD NOT be executed before `before_m100`');

          Assert.isUndefined(log.body, '`body` callback SHOULD NOT be executed before `body`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `before_m100`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `before_m100`');
          
          log.before_m100 = true;
        }
      });
      //create `before_m10` callback
      Y.Mock.expect(mock, {
        method : 'before_m10',
        run : function() {
          //this should be executed after `before_m100`
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `before_m10`');
          Assert.isUndefined(log.before_m10, '`before_m10` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.before_0, '`before_0` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.before, '`before` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.before_p10, '`before_p10` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.before_p100, '`before_p100` callback SHOULD NOT be executed before `before_m10`');

          Assert.isUndefined(log.body, '`body` callback SHOULD NOT be executed before `body`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `before_m10`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `before_m10`');
          
          log.before_m10 = true;
        }
      });
      //create `before_0` callback
      /**
       * This callback have priority == 0, same as default;
       * Since this callback is defined before the `before` (which priority is default) - it should be executed before
       */
      Y.Mock.expect(mock, {
        method : 'before_0',
        run : function() {
          //this should be executed after before_m10
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `before_0`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `before_0`');
          Assert.isUndefined(log.before_0, '`before_0` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.before, '`before` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.before_p10, '`before_p10` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.before_p100, '`before_p100` callback SHOULD NOT be executed before `before_0`');

          Assert.isUndefined(log.body, '`body` callback SHOULD NOT be executed before `body`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `before_0`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `before_0`');

          log.before_0 = true;
        }
      });
      //create `before` callback
      Y.Mock.expect(mock, {
        method : 'before',
        run : function() {
          //this should be executed after before_0
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `before`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `before`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.before, '`before` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.before_p10, '`before_p10` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.before_p100, '`before_p100` callback SHOULD NOT be executed before `before`');

          Assert.isUndefined(log.body, '`body` callback SHOULD NOT be executed before `body`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `before`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `before`');
          
          log.before = true;
        }
      });

      //create `before_p10` callback
      Y.Mock.expect(mock, {
        method : 'before_p10',
        run : function() {
          //this should be executed after before_0
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `before_p10`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `before_p10`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `before_p10`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `before_p10`');
          Assert.isUndefined(log.before_p10, '`before_p10` callback SHOULD NOT be executed before `before_p10`');
          Assert.isUndefined(log.before_p100, '`before_p100` callback SHOULD NOT be executed before `before_p10`');

          Assert.isUndefined(log.body, '`body` callback SHOULD NOT be executed before `body`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `before_p10`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `before_p10`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `before_p10`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `before_p10`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `before_p10`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `before_p10`');
          
          log.before_p10 = true;
        }
      });
      //create `before_p100` callback
      Y.Mock.expect(mock, {
        method : 'before_p100',
        run : function() {
          //this should be executed after before_p10
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `before_p100`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `before_p100`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `before_p100`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `before_p100`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `before_p100`');
          Assert.isUndefined(log.before_p100, '`before_p100` callback SHOULD NOT be executed before `before_p100`');

          Assert.isUndefined(log.body, '`body` callback SHOULD NOT be executed before `before_p100`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `before_p100`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `before_p100`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `before_p100`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `before_p100`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `before_p100`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `before_p100`');
          
          log.before_p100 = true;
        }
      });

      //create `after_m100` callback
      Y.Mock.expect(mock, {
        method : 'after_m100',
        run : function() {
          //this should be executed after body callback
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `after_m100`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `after_m100`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `after_m100`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `after_m100`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `after_m100`');
          Assert.isTrue(log.before_p100, '`before_p100` callback SHOULD be executed before `after_m100`');

          Assert.isTrue(log.body, '`body` callback SHOULD be executed before `after_m100`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `after_m100`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `after_m100`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `after_m100`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `after_m100`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `after_m100`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `after_m100`');

          log.after_m100 = true;
        }
      });
      //create `after_m10` callback
      Y.Mock.expect(mock, {
        method : 'after_m10',
        run : function() {
          //this should be executed after `after_m100`
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `after_m10`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `after_m10`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `after_m10`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `after_m10`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `after_m10`');
          Assert.isTrue(log.before_p100, '`before_p100` callback SHOULD be executed before `after_m10`');

          Assert.isTrue(log.body, '`body` callback SHOULD be executed before `after_m10`');

          Assert.isTrue(log.after_m100, '`after_m100` callback SHOULD be executed before `after_m10`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `after_m10`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `after_m10`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `after_m10`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `after_m10`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `after_m10`');

          log.after_m10 = true;
        }
      });
      //create `after_0` callback
      /**
       * This callback have priority == 0, same as default;
       * Since this callback is defined before the `after` (which priority is default) - it should be executed before it
       */
      Y.Mock.expect(mock, {
        method : 'after_0',
        run : function() {
          //this should be executed after after_m10
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `after_0`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `after_0`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `after_0`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `after_0`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `after_0`');
          Assert.isTrue(log.before_p100, '`before_p100` callback SHOULD be executed before `after_0`');

          Assert.isTrue(log.body, '`body` callback SHOULD be executed before `after_0`');

          Assert.isTrue(log.after_m100, '`after_m100` callback SHOULD be executed before `after_0`');
          Assert.isTrue(log.after_m10, '`after_m10` callback SHOULD be executed before `after_0`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `after_0`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `after_0`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `after_0`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `after_0`');

          log.after_0 = true;
        }
      });
      //create `after` callback
      Y.Mock.expect(mock, {
        method : 'after',
        run : function() {
          //this should be executed after after_0
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `after`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `after`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `after`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `after`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `after`');
          Assert.isTrue(log.before_p100, '`before_p100` callback SHOULD be executed before `after`');

          Assert.isTrue(log.body, '`body` callback SHOULD be executed before `after`');

          Assert.isTrue(log.after_m100, '`after_m100` callback SHOULD be executed before `after`');
          Assert.isTrue(log.after_m10, '`after_m10` callback SHOULD be executed before `after`');
          Assert.isTrue(log.after_0, '`after_0` callback SHOULD NOT be executed before `after`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `after`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `after`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `after`');

          log.after = true;
        }
      });

      //create `after_p10` callback
      Y.Mock.expect(mock, {
        method : 'after_p10',
        run : function() {
          //this should be executed after after_0
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.before_p100, '`before_p100` callback SHOULD be executed before `after_p10`');

          Assert.isTrue(log.body, '`body` callback SHOULD be executed before `after_p10`');

          Assert.isTrue(log.after_m100, '`after_m100` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.after_m10, '`after_m10` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.after_0, '`after_0` callback SHOULD be executed before `after_p10`');
          Assert.isTrue(log.after, '`after` callback SHOULD be executed before `after_p10`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `after_p10`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `after_p10`');

          log.after_p10 = true;
        }
      });
      //create `after_p100` callback
      Y.Mock.expect(mock, {
        method : 'after_p100',
        run : function() {
          //this should be executed after body
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.before_p100, '`before_p100` callback SHOULD be executed before `after_p100`');

          Assert.isTrue(log.body, '`body` callback SHOULD be executed before `after_p100`');

          Assert.isTrue(log.after_m100, '`after_m100` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.after_m10, '`after_m10` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.after_0, '`after_0` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.after, '`after` callback SHOULD be executed before `after_p100`');
          Assert.isTrue(log.after_p10, '`after_p10` callback SHOULD be executed before `after_p100`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `after_p100`');

          log.after_p100 = true;
        }
      });

      Y.Mock.expect(mock, {
        method : 'body',
        run : function() {
          //this should be executed after before_p100
          Assert.isTrue(log.before_m100, '`before_m100` callback SHOULD be executed before `body`');
          Assert.isTrue(log.before_m10, '`before_m10` callback SHOULD be executed before `body`');
          Assert.isTrue(log.before_0, '`before_0` callback SHOULD be executed before `body`');
          Assert.isTrue(log.before, '`before` callback SHOULD be executed before `body`');
          Assert.isTrue(log.before_p10, '`before_p10` callback SHOULD be executed before `body`');
          Assert.isTrue(log.before_p100, '`before_p100` callback SHOULD be executed before `body`');

          Assert.isUndefined(log.body, '`body` callback SHOULD NOT be executed before `body`');

          Assert.isUndefined(log.after_m100, '`after_m100` callback SHOULD NOT be executed before `body`');
          Assert.isUndefined(log.after_m10, '`after_m10` callback SHOULD NOT be executed before `body`');
          Assert.isUndefined(log.after_0, '`after_0` callback SHOULD NOT be executed before `body`');
          Assert.isUndefined(log.after, '`after` callback SHOULD NOT be executed before `body`');
          Assert.isUndefined(log.after_p10, '`after_p10` callback SHOULD NOT be executed before `body`');
          Assert.isUndefined(log.after_p100, '`after_p100` callback SHOULD NOT be executed before `body`');

          log.body = true;
        }
      });

      DM.before('foo', mock.before_p100, null, 100);
      DM.before('foo', mock.before_p10, null, 10);
      DM.before('foo', mock.before_0, null, 0);
      DM.before('foo', mock.before_m10, null, -10);
      DM.before('foo', mock.before_m100, null, -100);
      DM.before('foo', mock.before, null);

      DM.add('foo', mock.body);

      DM.after('foo', mock.after_p100, null, 100);
      DM.after('foo', mock.after_p10, null, 10);
      DM.after('foo', mock.after_0, null, 0);
      DM.after('foo', mock.after_m10, null, -10);
      DM.after('foo', mock.after_m100, null, -100);
      DM.after('foo', mock.after, null);

      DM.go();

      Y.Mock.verify(mock);
    }
  }));

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DOM Markers : basic stop',

    setUp : function() {
      Y.one('#dump').setHTML('<div id="node-a" data-marker="foo"></div>');

      this.nodes = {
        a : Y.one('#node-a')
      };
    },
    tearDown : function() {
      Y.one('#dump').empty();
      DM.removeAll();
    },
    "should stop the execution inside the before callback" : function() {
      DM.before('foo', function() {
        this.stop();
      });
      DM.add('foo', function() {
        throw new Error('Main callback should not be executed');
      });
      DM.after('foo', function() {
        throw new Error('After callback should not be executed');
      });

      DM.go();
    },
    "should stop the execution inside the first before callback" : function() {
      DM.before('foo', function() {
        this.stop();
      });
      DM.before('foo', function() {
        throw new Error('Before callback should not be executed');
      });
      DM.add('foo', function() {
        throw new Error('Main callback should not be executed');
      });
      DM.after('foo', function() {
        throw new Error('After callback should not be executed');
      });

      DM.go();
    },
    "should stop the execution inside the main callback" : function() {
      DM.add('foo', function() {
        this.stop();
      });
      DM.after('foo', function() {
        throw new Error('After callback should not be executed');
      });

      DM.go();
    },
    "should stop the execution inside the first after callback" : function() {
      DM.after('foo', function() {
        this.stop();
      });
      DM.after('foo', function() {
        throw new Error('After callback should not be executed');
      });

      DM.go();
    }
  }));

  //todo - test wait with different parameters
  //todo - test that wait isn't stop other process (other modules or elements)
  //todo - test next
  //todo - test detach
}, '0.2.2', {requires:['dm', 'test']});

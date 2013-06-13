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

  //todo - test wait with different parameters
  //todo - test contexts
  //todo - test stop/next
  //todo - test detach
  //todo - test before/after priorities

}, '0.2.1', {requires:['dm', 'test']});

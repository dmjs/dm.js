YUI.add('dm-test', function (Y) {

  var Assert      = Y.Assert,
    ArrayAssert = Y.ArrayAssert;

  Y.Test.Runner.add(new Y.Test.Case({
    name: 'DM.Test',

    // -- isWordBoundary() -----------------------------------------------------
    'should be ok 1': function () {
      Assert.isFalse(false);
    },
    'should be ok 2': function () {
      Assert.isTrue(true);
    }
  }));

}, '@VERSION@', {requires:['dm', 'test']});

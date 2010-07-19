new Test.Unit.Runner({

  'testToArray': function() {
    this.assertEnumEqual([],            fuse.String('').toArray());
    this.assertEnumEqual(['a'],         fuse.String('a').toArray());
    this.assertEnumEqual(['a','b'],     fuse.String('ab').toArray());
    this.assertEnumEqual(['f','o','o'], fuse.String('foo').toArray());
  },

  /*
    Note that camelize() differs from its Rails counterpart,
    as it is optimized for dealing with JavaScript object
    properties in conjunction with CSS property names:
     - Looks for dashes, not underscores
     - CamelCases first word if there is a front dash
  */
  'testToCamelCase': function() {
    this.assertEqual('', fuse.String('').toCamelCase(),
      'Empty string');

    this.assertEqual('', fuse.String('-').toCamelCase(),
      'Hyphen only');

    this.assertEqual('foo', fuse.String('foo').toCamelCase(),
      'String with no hyphens');

    this.assertEqual('foo_bar', fuse.String('foo_bar').toCamelCase(),
      'String with an underscore');

    this.assertEqual('fooBar',  fuse.String('foo-bar').toCamelCase(),
      'String with one hyphen');

    this.assertEqual('borderBottomWidth', fuse.String('border-bottom-width').toCamelCase(),
      'String simulating style property');

    this.assertEqual('classNameTest', fuse.String('class-name-test').toCamelCase(),
      'String simulating className (1)');

    this.assertEqual('classNameTest', fuse.String('className-test').toCamelCase(),
      'String simulating className (2)');

    this.assertEqual('classNameTest', fuse.String('class-nameTest').toCamelCase(),
      'String simulating className (2)');

    this.assertEqual('FooBar',  fuse.String('---foo-bar').toCamelCase(),
      'String with multiple leading hyphens');

    this.assertEqual('FooBar',  fuse.String('---foo---bar---').toCamelCase(),
      'String containing groups of hyphens');

    this.assertEqual('FooBar',  fuse.String('FooBar').toCamelCase(),
      'String pre-camelized');

    this.assertEqual('toString', fuse.String('toString').toCamelCase(),
      'Built-in Object.prototype.* members should not interfere with internal cache');

    /*
    this.benchmark(function(){
      'class-name-test'.toCamelCase();
    }, 10000);
    */
  },

  'testCapitalize': function() {
    this.assertEqual('',      fuse.String('').capitalize());
    this.assertEqual('Ä',    fuse.String('ä').capitalize());
    this.assertEqual('A',     fuse.String('A').capitalize());
    this.assertEqual('Hello', fuse.String('hello').capitalize());
    this.assertEqual('Hello', fuse.String('HELLO').capitalize());
    this.assertEqual('Hello', fuse.String('Hello').capitalize());
    this.assertEqual('Hello world', fuse.String('hello WORLD').capitalize());
  },

  'testUnderscore': function() {
    this.assertEqual('',    fuse.String('').underscore());
    this.assertEqual('_',   fuse.String('-').underscore());
    this.assertEqual('foo', fuse.String('foo').underscore());
    this.assertEqual('foo', fuse.String('Foo').underscore());
    this.assertEqual('foo_bar', fuse.String('foo_bar').underscore());

    this.assertEqual('border_bottom',       fuse.String('borderBottom').underscore());
    this.assertEqual('border_bottom_width', fuse.String('borderBottomWidth').underscore());
    this.assertEqual('border_bottom_width', fuse.String('border-Bottom-Width').underscore());
  },

  'testHyphenate': function() {
    this.assertEqual('',        fuse.String('').hyphenate());
    this.assertEqual('foo',     fuse.String('foo').hyphenate());
    this.assertEqual('Foo',     fuse.String('Foo').hyphenate());
    this.assertEqual('foo-bar', fuse.String('foo-bar').hyphenate());
    this.assertEqual('border-bottom-width',
      fuse.String('border_bottom_width').hyphenate());
  },

  'testTruncate': function() {
    var source = fuse.String('foo boo boz foo boo boz foo boo boz foo boo boz');

    this.assertEqual(source, source.truncate(source.length),
      'truncate length equal to string length');

    this.assertEqual('...', source.truncate(0),
      'truncate length of 0');

    this.assertEqual('foo boo boz foo boo boz foo...', source.truncate(undef),
      'truncate with undefined length');

    this.assertEqual('foo boo boz foo boo boz foo...', source.truncate('xyz'),
      'truncate with non-numeric length');

    this.assertEqual('fo...', source.truncate(5),
      'basic truncate');

    this.assertEqual('foo b', source.truncate(5, ''),
      'truncate with custom truncation text');

    this.assert(fuse.Object.isString(fuse.String('foo').truncate(5)),
     'non truncated result is not a string');

    this.assert(fuse.Object.isString(fuse.String('foo bar baz').truncate(5)),
      'truncated result is not a string');
  },

  'testContains': function() {
    this.assert(fuse.String('hello world').contains('h'));
    this.assert(fuse.String('hello world').contains('hello'));
    this.assert(fuse.String('hello world').contains('llo w'));
    this.assert(fuse.String('hello world').contains('world'));

    this.assert(!fuse.String('hello world').contains('bye'));
    this.assert(!fuse.String('').contains('bye'));
  },

  'testStartsWith': function() {
    this.assert(fuse.String('hello world').startsWith('h'));
    this.assert(fuse.String('hello world').startsWith('hello'));

    this.assert(!fuse.String('hello world').startsWith('bye'));
    this.assert(!fuse.String('').startsWith('bye'));
    this.assert(!fuse.String('hell').startsWith('hello'));
  },

  'testEndsWith': function() {
    this.assert(fuse.String('hello world').endsWith('d'));
    this.assert(fuse.String('hello world').endsWith(' world'));
    this.assert(fuse.String('hello world world').endsWith(' world'));

    this.assert(!fuse.String('hello world').endsWith('planet'));
    this.assert(!fuse.String('').endsWith('planet'));
    this.assert(!fuse.String('z').endsWith('az'));

    this.assert(fuse.String('hello world').endsWith(''),
      'failed empty string test');

    this.assertRaise('TypeError',
      function() { fuse.String('hello world').endsWith() },
      'failed to raise error when passed a non string pattern');
  },

  'testIsBlank': function() {
    this.assert(fuse.String('').isBlank());
    this.assert(fuse.String(' ').isBlank());
    this.assert(fuse.String('\t\r\n ').isBlank());

    this.assert(!fuse.String('a').isBlank());
    this.assert(!fuse.String('\t y \n').isBlank());
  },

  'testIsEmpty': function() {
    this.assert(fuse.String('').isEmpty());

    this.assert(!fuse.String(' ').isEmpty());
    this.assert(!fuse.String('\t\r\n ').isEmpty());
    this.assert(!fuse.String('a').isEmpty());
    this.assert(!fuse.String('\t y \n').isEmpty());
  },

  'testSucc': function() {
    this.assertEqual('b',    fuse.String('a').succ());
    this.assertEqual('B',    fuse.String('A').succ());
    this.assertEqual('1',    fuse.String('0').succ());
    this.assertEqual('abce', fuse.String('abcd').succ());
    this.assertEqual('{',    fuse.String('z').succ());
    this.assertEqual(':',    fuse.String('9').succ());
  },

  'testRepeat': function() {
    this.assertEqual('',      fuse.String('').repeat(0));
    this.assertEqual('',      fuse.String('').repeat(5));
    this.assertEqual('',      fuse.String('a').repeat(-1));
    this.assertEqual('',      fuse.String('a').repeat(0));
    this.assertEqual('a',     fuse.String('a').repeat(1));
    this.assertEqual('aa',    fuse.String('a').repeat(2));
    this.assertEqual('aaaaa', fuse.String('a').repeat(5));

    this.assertEqual('foofoofoofoofoo', fuse.String('foo').repeat(5));
    this.assertEqual('', fuse.String('foo').repeat(-5));

    /*
    window.String.prototype.oldTimes = function(count) {
      var result = '';
      for (var i = 0; i < count; i++) result += this;
      return result;
    };

    this.benchmark(function() {
      'foo'.repeat(15);
    }, 1000, 'new: ');

    this.benchmark(function() {
      'foo'.oldTimes(15);
    }, 1000, 'previous: ');
    */
  }
});
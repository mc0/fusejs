new Test.Unit.Runner({

  'testArrayConcat': function() {
    var self = this,
     object = { '0':0, '2':2, 'length':3 };

    // test passing an arguments object to concat
    (function() {
      self.assertEqual(1,
        fuse.Array().concat(arguments).length,
        'treats arguments as an array');
    })(1, 2);

    var array = fuse.Array('a', 'b', 'c');
    this.assertEnumEqual($w('a b c d e f g h i'),
      array.concat(['d', 'e'], 'f', ['g', 'h'], ['i']),
      'failed basic concat test');

    // test falsy values
    var expected = [8, 9, 0, 'a', null, undef, false, 'd'];
    this.assertEnumEqual(expected,
      fuse.Array.from(8).concat([9, 0], 'a', [null], undef, false, 'd'),
      'failed to concat falsy values');

    // test undefined indexs
    array = fuse.Array(3);
    array = array.concat(array);
    this.assert(!(4 in array), 'Undefined indexs should be left unset.');

    // test setting a different `this`
    array = [3]; array[2] = 4;
    this.assertEnumEqual([object, 3, undef, 4, 5],
      fuse.Array.plugin.concat.call(object, array, 5),
      'Should work when called with an object as the `this` value');

    this.assertEnumEqual(['a', 'b'],
      fuse.Array.plugin.concat.call('a', 'b'),
      'Should work when called with a string as the `this` value');
  },

  'testRegExpExec': function() {
    var results = fuse.RegExp('x(y)?').exec('x');
    this.assertEqual(true, '1' in results,
      'Should not return a sparse array.');

    this.assertEnumEqual(['x', undef], results,
      'Should contain an undefined value.');
  },
  
  'testRegExpTest': function() {
    var pattern = fuse.RegExp('^', 'g');
    pattern.test('');

    this.assertEqual(0, pattern.lastIndex,
      'Should not set lastIndex for zero length matches.');
  },

  'testStringLastIndexOf': function() {
    // tests based on the V8 project's String.prototype.lastIndexOf unit tests
    var source = fuse.String('test test test');
    this.assertEqual(5,  source.lastIndexOf('test', 5));
    this.assertEqual(5,  source.lastIndexOf('test', 6));
    this.assertEqual(0,  source.lastIndexOf('test', 4));
    this.assertEqual(0,  source.lastIndexOf('test', 0));
    this.assertEqual(10, source.lastIndexOf('test'));
    this.assertEqual(-1, source.lastIndexOf('notpresent'));
    this.assertEqual(-1, source.lastIndexOf());
    this.assertEqual(10, source.lastIndexOf('test', 'string'));

    this.assertEqual(0, source.lastIndexOf('test', -1),
      'failed with negative position');

    // this.assertEqual(1,  new fuse.String().lastIndexOf.length);

    for (var i = source.length + 10; i >= 0; i--) {
      var expected = i < source.length ? i : source.length;
      this.assertEqual(expected, source.lastIndexOf('', i));
    }
  },

  'testStringMatch': function() {
    var source = fuse.String(''), pattern = /^/g;
    source.match(pattern);

    this.assertEqual(0, pattern.lastIndex,
      'Should not set lastIndex for zero length matches.');

    source  = fuse.String('oxo');
    pattern = /x/g;
    source.match(pattern);

    this.assertEqual(0, pattern.lastIndex,
      'Should not set lastIndex on global pattern.');

    pattern = /x/;
    source.match(pattern);

    this.assertEqual(0, pattern.lastIndex,
      'Should not set lastIndex on non-global pattern.');

    this.assertEqual(true, '1' in source.match(/x(y)?/),
      'Should not return a sparse array.');
  },

  'testStringReplace': function() {
    var expected, pattern, replacement, source,
     args = [], slice = [].slice;

    source   = fuse.String('321abc123');
    expected = '321xyz123';

    this.assertEqual(expected, source.replace('abc', 'xyz'),
      'Should replace simple string pattern.');

    this.assertEqual('_abc_', source.replace(/\d+/g, function() {
      args.push(slice.call(arguments, 0));
      return '_';
    }), 'Should replace with function as replaceent.');

    this.assertEnumEqual(['321', 0, '321abc123'], args[0],
      'Should pass proper arguments to the replacement function.');

    this.assertEqual(2, args.length,
      'Should execute the function for each replacement.');

    fuse.String('xy').replace(/x(z)?/, function() {
      args = slice.call(arguments, 0); 
    });

    this.assertEnumEqual(['x', undefined, 0, 'xy'], args,
      'Should pass undefined values to replacement function.');

    // more regexp and function tests
    source = fuse.String('foo boo boz');
    this.assertEqual('Foo boo boz',
      source.replace(/[^o]+/, function(string) {
        return string.toUpperCase();
      }), 'Should replace with simple regexp pattern.');

    this.assertEqual('Foo Boo BoZ',
      source.replace(/[^o]+/g, function(string) {
        return string.toUpperCase();
      }), 'Should replace with a global flag.');

    this.assertEqual('bar boo boz',
      source.replace(/FOO/i, function() {
        return 'bar';
      }), 'Should replace with a case insensitive flag.');

    this.assertEqual(source,
      source.replace('.*', fuse.Function.NOOP),
      'Should escape regular expression special characters.');

    this.assertEqual(source,
      source.replace('X', fuse.Function.NOOP),
      'Should not replace when a match is not found.');

    /*
    // crashes Safari 3.4 beta
    var test = this;
    source.replace(/(b(?:o)(z))/, function(substring, group1, group2, offset, string) {
      test.assertIdentical(window, this);
      test.assertEqual(5, arguments.length);
      test.assertEqual('boz', substring);
      test.assertEqual('boz', group1);
      test.assertEqual('z', group2);
      test.assertEqual(8, offset);
      test.assertEqual(source, string);
    });
    */

    this.assertEqual('foo undefined boz',
      source.replace('boo', fuse.Function.NOOP),
      'Should convert undefined value to "undefined".');

    this.assertEqual('foo null boz',
      source.replace('boo', function() { return null; }),
      'Should convert null values to "null".');

    pattern = /boo/g;
    pattern.lastIndex = source.length;

    this.assertEqual('foo bar boz',
      source.replace(pattern, function() { return 'bar'; }),
      'Should ignore regexp lastIndex.');

    // index and source
    source = fuse.String('foo boo boz');
    this.assertEqual('f1 b5 b9z',
      source.replace(/o+/g, function(match, index) { return index; }),
      'Should return correct index argument');

    this.assertEqual('foo boo bofoo boo boz',
      source.replace(/.$/, function(match, index, source) { return source;}),
      'Should return correct source argument.');

    // test empty
    source   = fuse.String('foo boo boz');
    expected = '-foo boo boz';
    pattern  = new RegExp('|');

    this.assertEqual(expected,
      source.replace(pattern, function() { return '-'; }),
      'Should work with regexps that match empty strings.');

    expected = '-f-o-o- -- -b-o-z-';
    pattern = new RegExp('boo|', 'g');

    this.assertEqual(expected,
      source.replace(pattern, function() { return '-'; }),
      'Should work with regexps with global flag that match empty strings.');

    source      = fuse.String('awesome');
    replacement = function() { return 'x' };
    expected    = 'xxsxoxmxex';
    pattern     = new RegExp('(awe|)', 'g');

    this.assertEqual(expected,
      source.replace(pattern, replacement),
      'Should work with regexps that match empty strings.');

    expected = 'awesomex';
    pattern  = new RegExp('(awe|)$', 'g');

    this.assertEqual(expected,
      source.replace(pattern, replacement),
      'Should work with regexps that match empty strings.');

    expected = 'xawesome';
    pattern  = /()/;

    this.assertEqual(expected,
      source.replace(pattern, replacement),
      'Should work with regexps that match empty strings.');

    expected = 'xaxwxexsxoxmxex';
    pattern  = /()/g;

    this.assertEqual(expected,
      source.replace(pattern, replacement),
      'Should work with regexps that match empty strings.');

    pattern = new RegExp('','g');
    this.assertEqual(expected,
      source.replace(pattern, replacement),
      'Should work with regexps that match empty strings.');
  },

  'testStringSearch': function() {
    var pattern = /^/g;
    fuse.String('').search(pattern);

    this.assertEqual(0, pattern.lastIndex,
      'Should not set lastIndex for zero length matches.');
  },

  'testStringSplitWithRegExp': function() {
    this.assertEnumEqual([''],                 fuse.String('').split());
    this.assertEnumEqual([''],                 fuse.String('').split(/./));
    this.assertEnumEqual([],                   fuse.String('').split(/.?/));
    this.assertEnumEqual([],                   fuse.String('').split(/.??/));
    this.assertEnumEqual(['', 'b'],            fuse.String('ab').split(/a*/));
    this.assertEnumEqual(['a', 'b'],           fuse.String('ab').split(/a*?/));
    this.assertEnumEqual(['', ''],             fuse.String('ab').split(/(?:ab)/));
    this.assertEnumEqual(['', ''],             fuse.String('ab').split(/(?:ab)*/));
    this.assertEnumEqual(['a', 'b'],           fuse.String('ab').split(/(?:ab)*?/));
    this.assertEnumEqual(['t', 'e', 's', 't'], fuse.String('test').split(''));
    this.assertEnumEqual(['test'],             fuse.String('test').split());
    this.assertEnumEqual(['', '', '', ''],     fuse.String('111').split(1));

    this.assertEnumEqual(['t', 'e'],           fuse.String('test').split(/(?:)/, 2));
    this.assertEnumEqual(['t', 'e', 's', 't'], fuse.String('test').split(/(?:)/, -1));
    this.assertEnumEqual(['t', 'e', 's', 't'], fuse.String('test').split(/(?:)/, undef));
    this.assertEnumEqual([],                   fuse.String('test').split(/(?:)/, null));
    this.assertEnumEqual([],                   fuse.String('test').split(/(?:)/, NaN));
    this.assertEnumEqual(['t'],                fuse.String('test').split(/(?:)/, true));
    this.assertEnumEqual(['t', 'e'],           fuse.String('test').split(/(?:)/, '2'));
    this.assertEnumEqual([],                   fuse.String('test').split(/(?:)/, 'two'));

    this.assertEnumEqual(['a'],                       fuse.String('a').split(/-/));
    this.assertEnumEqual(['a'],                       fuse.String('a').split(/-?/));
    this.assertEnumEqual(['a'],                       fuse.String('a').split(/-??/));
    this.assertEnumEqual(['', ''],                    fuse.String('a').split(/a/));
    this.assertEnumEqual(['', ''],                    fuse.String('a').split(/a?/));
    this.assertEnumEqual(['a'],                       fuse.String('a').split(/a??/));
    this.assertEnumEqual(['ab'],                      fuse.String('ab').split(/-/));
    this.assertEnumEqual(['a', 'b'],                  fuse.String('ab').split(/-?/));
    this.assertEnumEqual(['a', 'b'],                  fuse.String('ab').split(/-??/));
    this.assertEnumEqual(['a', 'b'],                  fuse.String('a-b').split(/-/));
    this.assertEnumEqual(['a', 'b'],                  fuse.String('a-b').split(/-?/));
    this.assertEnumEqual(['a', '-', 'b'],             fuse.String('a-b').split(/-??/));
    this.assertEnumEqual(['a', '', 'b'],              fuse.String('a--b').split(/-/));
    this.assertEnumEqual(['a', '', 'b'],              fuse.String('a--b').split(/-?/));
    this.assertEnumEqual(['a', '-', '-', 'b'],        fuse.String('a--b').split(/-??/));
    this.assertEnumEqual([],                          fuse.String('').split(/()()/));
    this.assertEnumEqual(['.'],                       fuse.String('.').split(/()()/));
    this.assertEnumEqual(['', '.', '', ''],           fuse.String('.').split(/(.?)(.?)/));
    this.assertEnumEqual(['.'],                       fuse.String('.').split(/(.??)(.??)/));
    this.assertEnumEqual(['', '.', undef, ''],        fuse.String('.').split(/(.)?(.)?/));
    this.assertEnumEqual(['t', undef, 'e', 's', 't'], fuse.String('tesst').split(/(s)*/));
    this.assertEnumEqual(['t', '', 'e', 'ss', 't'],   fuse.String('tesst').split(/(s*)/));
    this.assertEnumEqual(['t', 'e', 't'],             fuse.String('tesst').split(/(?:s)*/));
    this.assertEnumEqual(['te', 's', 'st'],           fuse.String('tesst').split(/(?=s+)/));
    this.assertEnumEqual(['', 'es', ''],              fuse.String('test').split('t'));
    this.assertEnumEqual(['t', 't'],                  fuse.String('test').split('es'));
    this.assertEnumEqual(['', 'es', ''],              fuse.String('test').split(/t/));
    this.assertEnumEqual(['t', 't'],                  fuse.String('test').split(/es/));
    this.assertEnumEqual(['', 't', 'es', 't', ''],    fuse.String('test').split(/(t)/));
    this.assertEnumEqual(['t', 'es', 't'],            fuse.String('test').split(/(es)/));

    this.assertEnumEqual(['', 't', 'e', 's', 't', ''],
      fuse.String('test').split(/(t)(e)(s)(t)/));

    this.assertEnumEqual(['', '.', '.', '.', '', '', ''],
      fuse.String('.').split(/(((.((.??)))))/));

    this.assertEnumEqual(['.'],
      fuse.String('.').split(/(((((.??)))))/));

    this.assertEnumEqual(['t', undef, 'e', undef, 's', undef, 's', undef, 't'],
      fuse.String('tesst').split(/(s)*?/));

    this.assertEnumEqual(['t', '', 'e', '', 's', '', 's', '', 't'],
      fuse.String('tesst').split(/(s*?)/));

    var ecmaSampleRe = /<(\/)?([^<>]+)>/;
    this.assertEnumEqual(
      ['A', undef, 'B', 'bold', '/', 'B', 'and', undef, 'CODE', 'coded', '/', 'CODE', ''],
      fuse.String('A<B>bold</B>and<CODE>coded</CODE>').split(ecmaSampleRe));
  },

  'testStringTrimMethods': function() {
    var string, key, whitespace = '';
    for (key in fuse.RegExp.SPECIAL_CHARS.s) whitespace += key;
    string = fuse.String(whitespace + 'hello  \n  world' + whitespace);

    this.assertEqual('hello  \n  world',  string.trim(),
      'String#trim should remove all types of whitespace.');
 
    this.assertEqual('hello  \n  world' + whitespace, string.trimLeft(),
      'String#trimLeft should remove all types of whitespace.');

    this.assertEqual(whitespace + 'hello  \n  world', string.trimRight(),
      'String#trimRight should remove all types of whitespace.');
  }
});
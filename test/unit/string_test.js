new Test.Unit.Runner({

  'testInterpret': function(){
    this.assertEqual('true',    fuse.String.interpret(true));
    this.assertEqual('123',     fuse.String.interpret(123));
    this.assertEqual('foo bar', fuse.String.interpret('foo bar'));
    this.assertEqual('object string',
      fuse.String.interpret({ 'toString': function(){ return 'object string' } }));

    this.assertEqual('0',     fuse.String.interpret(0));
    this.assertEqual('false', fuse.String.interpret(false));
    this.assertEqual('',      fuse.String.interpret(undef));
    this.assertEqual('',      fuse.String.interpret(null));
    this.assertEqual('',      fuse.String.interpret(''));
  },

  'testMatch': function() {
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

  'testReplace': function() {
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
      source.replace('.*', fuse.emptyFunction),
      'Should escape regular expression special characters.');

    this.assertEqual(source,
      source.replace('X', fuse.emptyFunction),
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
      source.replace('boo', fuse.emptyFunction),
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
  'testCamelize': function() {
    this.assertEqual('', fuse.String('').camelize(),
      'Empty string');

    this.assertEqual('', fuse.String('-').camelize(),
      'Hyphen only');

    this.assertEqual('foo', fuse.String('foo').camelize(),
      'String with no hyphens');

    this.assertEqual('foo_bar', fuse.String('foo_bar').camelize(),
      'String with an underscore');

    this.assertEqual('fooBar',  fuse.String('foo-bar').camelize(),
      'String with one hyphen');

    this.assertEqual('borderBottomWidth', fuse.String('border-bottom-width').camelize(),
      'String simulating style property');

    this.assertEqual('classNameTest', fuse.String('class-name-test').camelize(),
      'String simulating className (1)');

    this.assertEqual('classNameTest', fuse.String('className-test').camelize(),
      'String simulating className (2)');

    this.assertEqual('classNameTest', fuse.String('class-nameTest').camelize(),
      'String simulating className (2)');

    this.assertEqual('FooBar',  fuse.String('---foo-bar').camelize(),
      'String with multiple leading hyphens');

    this.assertEqual('FooBar',  fuse.String('---foo---bar---').camelize(),
      'String containing groups of hyphens');

    this.assertEqual('FooBar',  fuse.String('FooBar').camelize(),
      'String pre-camelized');

    this.assertEqual('toString', fuse.String('toString').camelize(),
      'Built-in Object.prototype.* members should not interfere with internal cache');

    /*
    this.benchmark(function(){
      'class-name-test'.camelize();
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

  'testSearch': function() {
    var pattern = /^/g;
    fuse.String('').search(pattern);

    this.assertEqual(0, pattern.lastIndex,
      'Should not set lastIndex for zero length matches.');
  },

  'testSplitWithRegExp': function() {
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

  'testStripTags': function() {
    this.assertEqual('hello world',
      fuse.String('hello world').stripTags());

    this.assertEqual('hello world',
      fuse.String('hello <span>world</span>').stripTags());

    this.assertEqual('hello world',
      fuse.String('<a href="#" onclick="moo!">hello</a> world').stripTags());

    this.assertEqual('hello world',
      fuse.String('h<b><em>e</em></b>l<i>l</i>o w<span class="moo" id="x"><b>o</b></span>rld').stripTags());

    this.assertEqual('hello world',
      fuse.String('hello wor<input type="text" value="foo>bar">ld').stripTags());

    this.assertEqual('1\n2',
      fuse.String('1\n2').stripTags());

    this.assertEqual('one < two blah baz', fuse.String(
      'one < two <a href="# "\ntitle="foo > bar" >blah</a > <input disabled>baz').stripTags(),
      'failed to ignore none tag related `<` or `>` characters');

    this.assertEqual('1<invalid a="b&c"/>2<invalid a="b<c">3<invald a="b"c">4<invalid  a =  "bc">', fuse.String(
      '<b>1</b><invalid a="b&c"/><img a="b>c" />2<invalid a="b<c"><b a="b&amp;c">3</b>' +
      '<invald a="b"c"><b a="b&#38;c" >4</b><invalid  a =  "bc">').stripTags(),
      'failed to ignore invalid tags');
  },

  'testStripScripts': function() {
    this.assertEqual('foo bar', fuse.String('foo bar').stripScripts());
    this.assertEqual('foo bar', fuse.String('foo <script>boo();<\/script>bar').stripScripts());
    this.assertEqual('foo bar', fuse.String('foo <script type="text/javascript">boo();\nmoo();<\/script>bar').stripScripts());
  },


  'testTruncate': function() {
    var undef,
     source = fuse.String('foo boo boz foo boo boz foo boo boz foo boo boz');

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

  'testTrim': function() {
    this.assertEqual('hello world',      fuse.String('   hello world  ').trim());
    this.assertEqual('hello world',      fuse.String('hello world').trim());
    this.assertEqual('hello  \n  world', fuse.String('  hello  \n  world  ').trim());
    this.assertEqual('',                 fuse.String(whitespaceChars).trim());
  },

  'testTrimLeft': function() {
    this.assertEqual('hello world  ',      fuse.String('   hello world  ').trimLeft());
    this.assertEqual('hello world',        fuse.String('hello world').trimLeft());
    this.assertEqual('hello  \n  world  ', fuse.String('  hello  \n  world  ').trimLeft());
    this.assertEqual('',                   fuse.String(whitespaceChars).trimLeft());
  },

  'testTrimRight': function() {
    this.assertEqual('   hello world',     fuse.String('   hello world  ').trimRight());
    this.assertEqual('hello world',        fuse.String('hello world').trimRight());
    this.assertEqual('  hello  \n  world', fuse.String('  hello  \n  world  ').trimRight());
    this.assertEqual('',                   fuse.String(whitespaceChars).trimRight());
  },

  'testExtractScripts': function() {
    this.assertEnumEqual([],         fuse.String('foo bar').extractScripts());
    this.assertEnumEqual(['boo();'], fuse.String('foo <script>boo();<\/script>bar').extractScripts());

    this.assertEnumEqual(['boo();','boo();\nmoo();'],
      fuse.String('foo <script>boo();<\/script><script type="text/javascript">boo();\nmoo();<\/script>bar').extractScripts());

    this.assertEnumEqual(['boo();','boo();\nmoo();'],
      fuse.String('foo <script>boo();<\/script>blub\nblub<script type="text/javascript">boo();\nmoo();<\/script>bar').extractScripts());

    this.assertEnumEqual(['methodA();', 'methodB();','methodC();'],
      fuse.String('blah<!--\n<script>removedA();<\/script>\n-->' +
        '<script type="text/javascript">methodA();<\/script>' +
        '<!--\n<script>removedB();<\/script>\n-->' +
        '<script></script>blah<script>methodB();<\/script>blah' +
        '<!--\n<script type="text/javascript">removedC();<\/script>\n-->' +
        '<script>methodC();<\/script>').extractScripts());

    this.assertEnumEqual(['\n      alert("Scripts work too");\n    '],
      fuse.String('\u003Cdiv id=\"testhtml"\u003E\n  \u003Cdiv\u003E\n    ' +
        'Content successfully replaced\n    \u003Cscript\u003E\n      ' +
        'alert("Scripts work too");\n    \u003C/script\u003E\n  \u003C /div\u003E\n' +
        '\u003C/div\u003E\n').extractScripts());

    var russianChars = '//\u00c3\u00c2\u00ba\u00c3\u00c5\u00b8\u00c3\u00c5\u00c3' +
       '\u00c2\u00b5\u00c3\u00c5\u00c3\u00c2\u00c3\u00c2\u00b0\u00c3\u00c2\u00c3' +
       '\u00c5\u00be\u00c3\u00c2\u00b9\n';

    var longComment = '//' + Array(7000).join('.') + '\n',
     longScript = '\nvar foo = 1;\n' + russianChars + longComment,
     longString = 'foo <script type="text/javascript">' + longScript + '<'+'/script> bar';

    this.assertEnumEqual([longScript], fuse.String(longString).extractScripts());

    /*
    var str = 'foo <script>boo();<'+'/script>blub\nblub<script type="text/javascript">boo();\nmoo();<'+'/script>bar';
    this.benchmark(function() { str.extractScripts() }, 1000);
    */
  },

  'testEvalScripts': function() {
    this.assertEqual(0, evalScriptsCounter,
      'Sanity check. No scripts should be evaled yet.');

    fuse.String('foo <script>evalScriptsCounter++<\/script>bar').evalScripts();
    this.assertEqual(1, evalScriptsCounter);

    var stringWithScripts = '';
    fuse.Number(3).times(function(){ stringWithScripts += 'foo <script>evalScriptsCounter++<\/script>bar' });
    fuse.String(stringWithScripts).evalScripts();
    this.assertEqual(4, evalScriptsCounter);

    this.assertEnumEqual([4, 'hello world!'],
      fuse.String('<script>2 + 2</script><script>"hello world!"</script>').evalScripts(),
      'Should return the evaled scripts.');
  },

  'testEscapeHTML': function() {
    this.assertEqual('foo bar',    fuse.String('foo bar').escapeHTML());

    var expected = 'foo \u00c3\u00178 bar';
    this.assertEqual(expected, fuse.String(expected).escapeHTML());

    this.assertEqual('foo &lt;span&gt;bar&lt;/span&gt;',
      fuse.String('foo <span>bar</span>').escapeHTML());

    expected = '\u00e3\u00a6\u00e3\u00a3\u00e3\u00a1\u00e3\u00b3\u00e3' +
      '\u00ba2007\n\u00e3\u00af\u00e3\u00ab\u00e3\u00bc\u00e3\u00ba\u00e3' +
      '\u00b3\u00e3\u00ac\u00e3\u00af\u00e3\u00b7\u00e3\u00a7\u00e3\u00b3';

    this.assertEqual(expected,
      fuse.String(expected).escapeHTML());

    this.assertEqual('a&lt;a href="blah"&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g',
      fuse.String('a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g').escapeHTML());

    this.assertEqual(largeTextEscaped, largeTextUnescaped.escapeHTML());

    this.assertEqual('&amp;', fuse.String('&').escapeHTML());
    this.assertEqual('1\n2',  fuse.String('1\n2').escapeHTML());

    /* this.benchmark(function() { largeTextUnescaped.escapeHTML() }, 1000); */
  },

  'testUnescapeHTML': function() {
    this.assertEqual('foo bar',
      fuse.String('foo bar').unescapeHTML());

    this.assertEqual('foo <span>bar</span>',
      fuse.String('foo &lt;span&gt;bar&lt;/span&gt;').unescapeHTML());

    this.assertEqual('foo ß bar',
      fuse.String('foo ß bar').unescapeHTML());

    this.assertEqual('a<a href="blah">blub</a>b<span><div></div></span>cdef<strong>!!!!</strong>g',
      fuse.String('a&lt;a href="blah"&gt;blub&lt;/a&gt;b&lt;span&gt;&lt;div&gt;&lt;/div&gt;&lt;/span&gt;cdef&lt;strong&gt;!!!!&lt;/strong&gt;g').unescapeHTML());

    this.assertEqual(largeTextUnescaped, largeTextEscaped.unescapeHTML());

    this.assertEqual('test \xfa',
      fuse.String('test &uacute;').unescapeHTML());

    this.assertEqual('1\n2',
      fuse.String('1\n2').unescapeHTML(),
      'Failed with newlines');

    this.assertEqual('<h1>Pride & Prejudice</h1>',
      fuse.String('<h1>Pride &amp; Prejudice</h1>').unescapeHTML(),
      'Failed on string containing unescaped tags');

    var sameInSameOut = fuse.String('"&lt;" means "<" in HTML');
    this.assertEqual(sameInSameOut, sameInSameOut.escapeHTML().unescapeHTML());

    /* this.benchmark(function() { largeTextEscaped.unescapeHTML() }, 1000); */
  },

  'testToQueryParams': function() {
    // only the query part
    var result = { 'a':undef, 'b':'c' };

    this.assertHashEqual({ },
      fuse.String('').toQueryParams(),
      'empty query');

    this.assertHashEqual({ },
      fuse.String('foo?').toQueryParams(),
      'empty query with URL');

    this.assertHashEqual(result,
      fuse.String('foo?a&b=c').toQueryParams(),
      'query with URL');

    this.assertHashEqual(result,
      fuse.String('foo?a&b=c#fragment').toQueryParams(),
      'query with URL and fragment');

    this.assertHashEqual(result,
      fuse.String('a;b=c').toQueryParams(';'),
      'custom delimiter');

    this.assertHashEqual({ 'a': undef },
      fuse.String('a').toQueryParams(),
      'key without value');

    this.assertHashEqual({ 'a': 'b' },
      fuse.String('a=b&=c').toQueryParams(),
      'empty key');

    this.assertHashEqual({ 'a': 'b', 'c': '' },
      fuse.String('a=b&c=').toQueryParams(),
      'empty value');

    this.assertHashEqual({ 'a': 'b', 'c': undef },
      fuse.Object.toQueryString(fuse.String('a=b&c').toQueryParams()).toQueryParams(),
      'cross-convert containing an undefined value');

    this.assertHashEqual({'a b':'c', 'd':'e f', 'g':'h' },
      fuse.String('a%20b=c&d=e%20f&g=h').toQueryParams(),
      'proper decoding');

    this.assertHashEqual({ 'a':'b=c=d' },
      fuse.String('a=b=c=d').toQueryParams(),
      'multiple equal signs');

    this.assertHashEqual({ 'a':'b', c:'d' },
      fuse.String('&a=b&&&c=d').toQueryParams(),
      'proper splitting');

    this.assertEnumEqual($w('r g b'),
      fuse.String('col=r&col=g&col=b').toQueryParams()['col'],
      'collection without square brackets');

    var msg = 'empty values inside collection';

    this.assertEnumEqual(['r', '', 'b'],
      fuse.String('c=r&c=&c=b').toQueryParams()['c'], msg);

    this.assertEnumEqual(['', 'blue'],
      fuse.String('c=&c=blue').toQueryParams()['c'],  msg);

    this.assertEnumEqual(['blue', ''],
      fuse.String('c=blue&c=').toQueryParams()['c'],  msg);

    this.assertHashEqual(Fixtures.mixed_dont_enum,
      fuse.String('a=A&b=B&toString=bar&valueOf=').toQueryParams(),
      'Should not iterate over inherited properties.');
  },

  'testInclude': function() {
    this.assert(fuse.String('hello world').contains('h'));
    this.assert(fuse.String('hello world').contains('hello'));
    this.assert(fuse.String('hello world').contains('llo w'));
    this.assert(fuse.String('hello world').contains('world'));

    this.assert(!fuse.String('hello world').contains('bye'));
    this.assert(!fuse.String('').contains('bye'));
  },

  'testLastIndexOf': function() {
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

  'testBlank': function() {
    this.assert(fuse.String('').blank());
    this.assert(fuse.String(' ').blank());
    this.assert(fuse.String('\t\r\n ').blank());

    this.assert(!fuse.String('a').blank());
    this.assert(!fuse.String('\t y \n').blank());
  },

  'testEmpty': function() {
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

  'testTimes': function() {
    this.assertEqual('',      fuse.String('').times(0));
    this.assertEqual('',      fuse.String('').times(5));
    this.assertEqual('',      fuse.String('a').times(-1));
    this.assertEqual('',      fuse.String('a').times(0));
    this.assertEqual('a',     fuse.String('a').times(1));
    this.assertEqual('aa',    fuse.String('a').times(2));
    this.assertEqual('aaaaa', fuse.String('a').times(5));

    this.assertEqual('foofoofoofoofoo', fuse.String('foo').times(5));
    this.assertEqual('', fuse.String('foo').times(-5));

    /*
    window.String.prototype.oldTimes = function(count) {
      var result = '';
      for (var i = 0; i < count; i++) result += this;
      return result;
    };

    this.benchmark(function() {
      'foo'.times(15);
    }, 1000, 'new: ');

    this.benchmark(function() {
      'foo'.oldTimes(15);
    }, 1000, 'previous: ');
    */
  }
});
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

  'testInclude': function() {
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
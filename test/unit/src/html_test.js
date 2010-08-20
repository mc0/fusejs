new Test.Unit.Runner({

  'testStripTags': function() {
    this.assertEqual('hello world',
      fuse.String('hello world').stripTags());

    this.assertEqual('hello world',
      fuse.String('hello <span>world<\/span>').stripTags());

    this.assertEqual('hello world',
      fuse.String('<a href="#" onclick="moo!">hello<\/a> world').stripTags());

    this.assertEqual('hello world',
      fuse.String('h<b><em>e<\/em><\/b>l<i>l<\/i>o w<span class="moo" id="x"><b>o<\/b><\/span>rld').stripTags());

    this.assertEqual('hello world',
      fuse.String('hello wor<input type="text" value="foo>bar">ld').stripTags());

    this.assertEqual('1\n2',
      fuse.String('1\n2').stripTags());

    this.assertEqual('one < two blah baz', fuse.String(
      'one < two <a href="# "\ntitle="foo > bar" >blah<\/a > <input disabled>baz').stripTags(),
      'failed to ignore none tag related `<` or `>` characters');

    this.assertEqual('1<invalid a="b&c"\/>2<invalid a="b<c">3<invald a="b"c">4<invalid  a =  "bc">', fuse.String(
      '<b>1<\/b><invalid a="b&c"\/><img a="b>c" \/>2<invalid a="b<c"><b a="b&amp;c">3<\/b>' +
      '<invald a="b"c"><b a="b&#38;c" >4<\/b><invalid  a =  "bc">').stripTags(),
      'failed to ignore invalid tags');
  },

  'testEscapeHTML': function() {
    this.assertEqual('foo bar', fuse.String('foo bar').escapeHTML());

    var expected = 'foo \u00c3\u00178 bar';
    this.assertEqual(expected, fuse.String(expected).escapeHTML());

    this.assertEqual('foo &lt;span&gt;bar&lt;\/span&gt;',
      fuse.String('foo <span>bar<\/span>').escapeHTML());

    expected = '\u00e3\u00a6\u00e3\u00a3\u00e3\u00a1\u00e3\u00b3\u00e3' +
      '\u00ba2007\n\u00e3\u00af\u00e3\u00ab\u00e3\u00bc\u00e3\u00ba\u00e3' +
      '\u00b3\u00e3\u00ac\u00e3\u00af\u00e3\u00b7\u00e3\u00a7\u00e3\u00b3';

    this.assertEqual(expected,
      fuse.String(expected).escapeHTML());

    this.assertEqual('a&lt;a href="blah"&gt;blub&lt;\/a&gt;b&lt;span&gt;&lt;div&gt;&lt;\/div&gt;&lt;\/span&gt;cdef&lt;strong&gt;!!!!&lt;\/strong&gt;g',
      fuse.String('a<a href="blah">blub<\/a>b<span><div><\/div><\/span>cdef<strong>!!!!<\/strong>g').escapeHTML());

    this.assertEqual(largeTextEscaped, largeTextUnescaped.escapeHTML());

    this.assertEqual('&amp;', fuse.String('&').escapeHTML());
    this.assertEqual('1\n2',  fuse.String('1\n2').escapeHTML());

    /* this.benchmark(function() { largeTextUnescaped.escapeHTML() }, 1000); */
  },

  'testUnescapeHTML': function() {
    this.assertEqual('foo bar',
      fuse.String('foo bar').unescapeHTML());

    this.assertEqual('foo <span>bar<\/span>',
      fuse.String('foo &lt;span&gt;bar&lt;\/span&gt;').unescapeHTML());

    this.assertEqual('foo ß bar',
      fuse.String('foo ß bar').unescapeHTML());

    this.assertEqual('a<a href="blah">blub<\/a>b<span><div><\/div><\/span>cdef<strong>!!!!<\/strong>g',
      fuse.String('a&lt;a href="blah"&gt;blub&lt;\/a&gt;b&lt;span&gt;&lt;div&gt;&lt;\/div&gt;&lt;\/span&gt;cdef&lt;strong&gt;!!!!&lt;\/strong&gt;g').unescapeHTML());

    this.assertEqual(largeTextUnescaped, largeTextEscaped.unescapeHTML());

    this.assertEqual('test \xfa',
      fuse.String('test &uacute;').unescapeHTML());

    this.assertEqual('1\n2',
      fuse.String('1\n2').unescapeHTML(),
      'Failed with newlines');

    this.assertEqual('<h1>Pride & Prejudice<\/h1>',
      fuse.String('<h1>Pride &amp; Prejudice<\/h1>').unescapeHTML(),
      'Failed on string containing unescaped tags');

    var sameInSameOut = fuse.String('"&lt;" means "<" in HTML');
    this.assertEqual(sameInSameOut, sameInSameOut.escapeHTML().unescapeHTML());

    /* this.benchmark(function() { largeTextEscaped.unescapeHTML() }, 1000); */
  }
});
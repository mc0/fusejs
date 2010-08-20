new Test.Unit.Runner({

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
        '<script><\/script>blah<script>methodB();<\/script>blah' +
        '<!--\n<script type="text/javascript">removedC();<\/script>\n-->' +
        '<script>methodC();<\/script>').extractScripts());

    this.assertEnumEqual(['\n      alert("Scripts work too");\n    '],
      fuse.String('\u003Cdiv id=\"testhtml"\u003E\n  \u003Cdiv\u003E\n    ' +
        'Content successfully replaced\n    \u003Cscript\u003E\n      ' +
        'alert("Scripts work too");\n    \u003C\/script\u003E\n  \u003C \/div\u003E\n' +
        '\u003C\/div\u003E\n').extractScripts());

    var russianChars = '//\u00c3\u00c2\u00ba\u00c3\u00c5\u00b8\u00c3\u00c5\u00c3' +
       '\u00c2\u00b5\u00c3\u00c5\u00c3\u00c2\u00c3\u00c2\u00b0\u00c3\u00c2\u00c3' +
       '\u00c5\u00be\u00c3\u00c2\u00b9\n';

    var longComment = '//' + Array(7000).join('.') + '\n',
     longScript = '\nvar foo = 1;\n' + russianChars + longComment,
     longString = 'foo <script type="text/javascript">' + longScript + '<\/script> bar';

    this.assertEnumEqual([longScript], fuse.String(longString).extractScripts());

    /*
    var str = 'foo <script>boo();<\/script>blub\nblub<script type="text/javascript">boo();\nmoo();<\/script>bar';
    this.benchmark(function() { str.extractScripts() }, 1000);
    */
  },

  'testRunScripts': function() {
    this.assertEqual(0, runScriptsCounter,
      'Sanity check. No scripts should be evaled yet.');

    fuse.String('foo <script>runScriptsCounter++<\/script>bar').runScripts();
    this.assertEqual(1, runScriptsCounter);

    var stringWithScripts = '';
    fuse.Number(3).times(function(){ stringWithScripts += 'foo <script>runScriptsCounter++<\/script>bar' });
    fuse.String(stringWithScripts).runScripts();
    this.assertEqual(4, runScriptsCounter);

    this.assertEnumEqual([4, 'hello world!'],
      fuse.String('<script>2 + 2<\/script><script>"hello world!"<\/script>').runScripts(),
      'Should return the evaled scripts.');
  },

  'testFuseRun': function() {
    var result = fuse.run('function foo() { }; foo;');
    this.assert(typeof window.foo == 'function',
     'Should create a global function declaration.');

    this.assertEqual(window.foo, result,
      'Should capture the result of the function declaration.');

    result = fuse.run('var bar = function() { }; bar;');
    this.assert(typeof window.bar == 'function',
      'Should assign a function expression to a global variable.');

    this.assertEqual(window.bar, result,
      'Should capture the result of the function expression assignment.');

    result = fuse.run('this.baz = function() { }');
    this.assert(typeof window.baz == 'function',
      'Should define a property on the global `this`.');

    this.assertEqual(window.baz, result,
      'Should capture the result of the global property assignment.');

    this.assertEqual('function',  fuse.run('typeof fuse'),
      'Should detect fuse on the global.');

    this.assertEqual('undefined', fuse.run('typeof fuse', window.frames[0]),
      'Should not detect fuse on the iframe\'s global.');

    this.assert(fuse.run('this.isIframeContext', window.frames[0]),
      'Should detect the `isIframeContext` variable on the iframe\'s global.');
  },

  'testStripScripts': function() {
    this.assertEqual('foo bar', fuse.String('foo bar').stripScripts());
    this.assertEqual('foo bar', fuse.String('foo <script>boo();<\/script>bar').stripScripts());
    this.assertEqual('foo bar', fuse.String('foo <script type="text/javascript">boo();\nmoo();<\/script>bar').stripScripts());
  }
});
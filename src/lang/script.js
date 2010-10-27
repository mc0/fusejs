  /*------------------------------ LANG: SCRIPT ------------------------------*/

  /* create shared pseudo private props */

  fuse.Object.extend(fuse._, {
    reHTMLComments:     /<!--[^\x00]*?-->/g,
    reOpenHTMLComments: /<!--/g,
    reOpenScriptTag:    /<script/i,
    reQuotes:           /(["'])(?:(?!\1)[^\\]|[^\\]|\\.)+?\1/g,
    reRegexps:          /(\/)(?:(?!\1)[^\\]|[^\\]|\\.)+?\1/g, //"
    reScripts:          /<script[^>]*>([^\x00]*?)<\/script>/gi,
    reQuoteTokens:      /@fuseQuoteToken/g,
    reRegexpTokens:     /@fuseRegexpToken/g,
    reScriptTokens:     /@fuseScript\d+Token/g,
    swappedQuotes:      [],
    swappedRegExps:     [],
    swappedScripts:     {}
  });

  fuse._.runCallback = function(code, index, array) {
    array[index] = fuse.run(code);
  };

  fuse._.swapQuotesToTokens = function(quote) {
    fuse._.swappedQuotes.unshift(quote);
    return '@fuseQuoteToken';
  };

  fuse._.swapRegexpsToTokens = function(regexp) {
    fuse._.swappedRegExps.unshift(regexp);
    return '@fuseRegexpToken';
  };

  fuse._.swapScriptsToTokens = function(script) {
    var p = fuse._, token = '@fuseScript' + (p.counter++) + 'Token';
    p.swappedScripts[token] = script;
    return token;
  };

  fuse._.swapTokensToQuotes = function() {
    return fuse._.swappedQuotes.pop();
  };

  fuse._.swapTokensToRegexps = function() {
    return fuse._.swappedRegExps.pop();
  };

  fuse._.swapTokensToScripts = function(token) {
    return fuse._.swappedScripts[token];
  };

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    function makeExecuter(context) {
      return context.Function('window',
        'return function (' + fuse.uid + '){' +
        'var arguments=window.arguments;' +
        'return window.eval(String(' + fuse.uid + '))}')(context);
    }

    function run(code, context) {
      var backup = window.fuse,
       execute = makeExecuter(window);

      var run = function run(code, context) {
        context || (context = window);
        if (context == window) return execute(code);

        var data, dom = fuse.dom;
        context = getWindow(context.raw || context);
        if (context == window) return execute(code);

        // cache executer for other contexts
        data = dom.data[dom.Node.getFuseId(context)];
        return (data._evaluator || (data._evaluator = makeExecuter(context)))(code);
      };

      run('var fuse="x"');

      if (window.fuse != 'x' && fuse.Object.isHostType(window, 'document')) {
        window.fuse = backup;
        if (fuse.dom.runScriptText('typeof this.fuse=="function"')) {
          run = fuse.dom.runScriptText;
        } else {
          // for Safari 2.0.0 and Firefox 2.0.0.2
          fuse.dom.runScriptText = run;
        }
      } else {
        window.fuse = backup;
      }

      // IE's eval will error if code contains <!--
      try {
        eval('<!--\n//-->');
      }
      catch (e) {
        var __run = run;
        run = function(code, context) {
          var p = fuse._;
          if (p.rawIndexOf.call(code, '<!--') > -1) {
            code = p.strReplace
              .call(code, p.reQuotes,    p.swapQuotesToTokens)
              .replace(p.reRegexps,      p.swapRegexpsToTokens)
              .replace(p.reHTMLComments, '//<!--')
              .replace(p.reQuoteTokens,  p.swapTokensToQuotes)
              .replace(p.reRegexpTokens, p.swapTokensToRegexps);
          }
          return __run(code, context);
        };
      }

      fuse.run = run;
      return run(code, context);
    }

    function runScripts() {
      return runScripts[ORIGIN].String.prototype
        .extractScripts.call(this, fuse._.runCallback);
    }

    function extractScripts(callback) {
      var match, p = fuse._, i = -1, string = String(this),
       result = extractScripts[ORIGIN].Array();

      if (!p.reOpenScriptTag.test(string)) {
        return result;
      }
      if (p.rawIndexOf.call(string, '<!--') > -1) {
        string = p.strReplace
          .call(string, p.reScripts, p.swapScriptsToTokens)
          .replace(p.reHTMLComments, '')
          .replace(p.reScriptTokens, p.swapTokensToScripts);

        // cleanup
        p.swappedScripts = { };
      }
      // clear lastIndex because exec() uses it as a starting point
      p.reScripts.lastIndex = 0;

      while (match = p.reScripts.exec(string)) {
        if (match = match[1]) {
          result[++i] = match;
          callback && callback(match, i, result);
        }
      }
      return result;
    }

    function stripScripts() {
      return stripScripts[ORIGIN].String(String(this).replace(fuse._.reScripts, ''));
    }

    /*------------------------------------------------------------------------*/

    fuse.run = run;

    (plugin.extractScripts = extractScripts)[ORIGIN] =
    (plugin.runScripts = runScripts)[ORIGIN] =
    (plugin.stripScripts = stripScripts)[ORIGIN] = fuse;

  })(fuse.String.plugin);

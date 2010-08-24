  /*------------------------------ LANG: SCRIPT ------------------------------*/

  (function(plugin) {

    var counter         = 0,
     indexOf            = ''.indexOf,
     reHTMLComments     = /<!--[^\x00]*?-->/g,
     reOpenHTMLComments = /<!--/g,
     reOpenScriptTag    = /<script/i,
     reQuotes           = /(["'])(?:(?!\1)[^\\]|[^\\]|\\.)+?\1/g,
     reRegexps          = /(\/)(?:(?!\1)[^\\]|[^\\]|\\.)+?\1/g, //"
     reScripts          = /<script[^>]*>([^\x00]*?)<\/script>/gi,
     reQuoteTokens      = /@fuseQuoteToken/g,
     reRegexpTokens     = /@fuseRegexpToken/g,
     reScriptTokens     = /@fuseScript\d+Token/g,
     swappedQuotes      = [],
     swappedRegExps     = [],
     swappedScripts     = {},

    runCallback = function(code, index, array) {
      array[index] = fuse.run(code);
    },

    strReplace = function(pattern, replacement) {
      return (strReplace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
        plugin.replace : plugin.replace.raw).call(this, pattern, replacement);
    },

    swapQuotesToTokens = function(quote) {
      swappedQuotes.unshift(quote);
      return '@fuseQuoteToken';
    },

    swapRegexpsToTokens = function(regexp) {
      swappedRegExps.unshift(regexp);
      return '@fuseRegexpToken';
    },

    swapScriptsToTokens = function(script) {
      var token = '@fuseScript' + (counter++) + 'Token';
      swappedScripts[token] = script;
      return token;
    },

    swapTokensToQuotes = function() {
      return swappedQuotes.pop();
    },

    swapTokensToRegexps = function() {
      return swappedRegExps.pop();
    },

    swapTokensToScripts = function(token) {
      return swappedScripts[token];
    };

    /*------------------------------------------------------------------------*/

    plugin.runScripts = function runScripts() {
      return plugin.extractScripts.call(this, runCallback);
    };

    plugin.extractScripts = function extractScripts(callback) {
      var match, i = -1, string = String(this), result = fuse.Array();

      if (!reOpenScriptTag.test(string)) {
        return result;
      }
      if (indexOf.call(string, '<!--') > -1) {
        string = strReplace
          .call(string, reScripts, swapScriptsToTokens)
          .replace(reHTMLComments, '')
          .replace(reScriptTokens, swapTokensToScripts);

        // cleanup
        swappedScripts = { };
      }
      // clear lastIndex because exec() uses it as a starting point
      reScripts.lastIndex = 0;

      while (match = reScripts.exec(string)) {
        if (match = match[1]) {
          result[++i] = match;
          callback && callback(match, i, result);
        }
      }
      return result;
    };

    plugin.stripScripts = function stripScripts() {
      return fuse.String(String(this).replace(reScripts, ''));
    };

    /*------------------------------------------------------------------------*/

    fuse.run = function run(code, context) {
      var backup = window.fuse,

      makeExecuter = function(context) {
        return context.Function('window',
          'return function (' + uid + '){' +
          'var arguments=window.arguments;' +
          'return window.eval(String(' + uid + '))}')(context);
      },

      run = function run(code, context) {
        context || (context = window);
        if (context == window) return execute(code);

        context = getWindow(context.raw || context);
        if (context == window) return execute(code);

        // cache executer for other contexts
        var id = getFuseId(context), data = domData[id];
        return (data._evaluator || (data._evaluator = makeExecuter(context)))(code);
      },

      execute = makeExecuter(window);

      run('var fuse="x"');

      if (window.fuse != 'x' && isHostType(window, 'document')) {
        window.fuse = backup;
        if (runScriptText('typeof this.fuse=="function"')) {
          run = runScriptText;
        } else {
          // for Safari 2.0.0 and Firefox 2.0.0.2
          fuse.dom.runScriptText = runScriptText = run;
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
          if (indexOf.call(code, '<!--') > -1) {
            code = strReplace
              .call(code, reQuotes,    swapQuotesToTokens)
              .replace(reRegexps,      swapRegexpsToTokens)
              .replace(reHTMLComments, '//<!--')
              .replace(reQuoteTokens,  swapTokensToQuotes)
              .replace(reRegexpTokens, swapTokensToRegexps);
          }
          return __run(code, context);
        };
      }

      fuse.run = run;
      return run(code, context);
    };

    // prevent JScript bug with named function expressions
    var extractScripts = null, run = null, runScripts = null, stripScripts = null;
  })(fuse.String.plugin);

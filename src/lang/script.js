  /*------------------------------ LANG: SCRIPT ------------------------------*/

  (function(plugin) {

    var counter         = 0,
     indexOf            = ''.indexOf,
     reHTMLComments     = /<!--[^\x00]*?-->/g,
     reOpenHTMLComments = /<!--/g,
     reOpenScriptTag    = /<script/i
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
          'return ("", eval)(String(' + uid + '))}')(context);
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

      setScriptText = function(element, text) {
        (element.firstChild ||
         element.appendChild(element.ownerDocument.createTextNode('')))
         .data = text || '';
      },

      execute = makeExecuter(window);

      try {
        // Opera 9.25 can't indirectly call eval()
        window.fuse = undef;
        execute('var fuse="x"');
        if (window.fuse != 'x') throw new EvalError;
      }
      catch (e) {
        // fallback on window.eval()
        makeExecuter = function(context) {
          return context.Function('window',
            'return function (' + uid + '){' +
            'var arguments=window.arguments;' +
            'return window.eval(String(' + uid + '))}')(context);
        };

        window.fuse = undef;
        execute = makeExecuter(window);
        execute('var fuse="x"');
      }

      if (window.fuse != 'x') {
        // fallback on script injection
        if (isHostType(window, 'document')) {
          run = function run(code, context) {
            context || (context = window);
            return execute(code, context == window ?
              context : getWindow(context.raw || context));
          };

          execute = function(code, context) {
            var parentNode, result, script,
             text = 'fuse.' + uid + '.returned = eval(';

            if (context == window) {
              context = fuse._doc;
            } else {
              context = getDocument(context);
              text = 'parent.' + text + 'parent.';
            }

            if (parentNode = context.getElementsByTagName('script')[0]) {
              parentNode = parentNode.parentNode;
            } else {
              parentNode = context.getElementsByTagName('head')[0] || context.documentElement;
            }

            text += 'fuse.' + uid + '.code);';

            // keep consistent behavior of `arguments`
            // uses an unresolvable reference so it can be deleted without
            // errors in JScript
            text = 'if("arguments" in this){' + text +
                   '}else{arguments=void 0;'  + text +
                   'delete arguments}';

            fuse[uid] = { 'code': String(code), 'returned': '' };
            script = Element.fromTagName('script', { 'context': context, 'decorate': false });
            setScriptText(script, text);

            // TODO: clear memory of removed script element for IE
            parentNode.insertBefore(script, parentNode.firstChild);
            parentNode.removeChild(script);

            result = fuse[uid].returned;
            delete fuse[uid];
            return result;
          };
        }
        else {
          execute = false;
        }
      }

      // IE's eval will error if code contains <!--
      if (execute) {
        try {
          execute('<!--\n//-->', window);
        }
        catch (e) {
          var __execute = execute;
          execute = function(code, context) {
            if (indexOf.call(code, '<!--') > -1) {
              code = strReplace
                .call(code, reQuotes,    swapQuotesToTokens)
                .replace(reRegexps,      swapRegexpsToTokens)
                .replace(reHTMLComments, '//<!--')
                .replace(reQuoteTokens,  swapTokensToQuotes)
                .replace(reRegexpTokens, swapTokensToRegexps);
            }
            return __execute(code, context);
          };
        }
      }
      // global eval is not supported :(
      else {
        execute = function(code, context) { throw new EvalError; };
      }

      if (envTest('ELEMENT_SCRIPT_HAS_TEXT_PROPERTY')) {
        setScriptText = function(element, text) {
          element.text = text || '';
        };
      }

      (window.fuse = backup).run = run;
      return run(code, context);
    };

    // prevent JScript bug with named function expressions
    var extractScripts = null, run = null, runScripts = null, stripScripts = null;
  })(fuse.String.plugin);

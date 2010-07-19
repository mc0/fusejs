  /*------------------------------- LANG: RUN --------------------------------*/

  (function() {

    fuse.run = function run(code, context) {
      var backup     = global.fuse,
      indexOf        = ''.indexOf,
      qCounter       = 0,
      rCounter       = 0,
      quotes         = [],
      regexps        = [],
      reHTMLComments = /<!--/g,
      reQuotes       = /(["'])(?:(?!\1)[^\\]|[^\\]|\\.)+?\1/g,
      reRegexps      = /(\/)(?:(?!\1)[^\\]|[^\\]|\\.)+?\1/g, //"
      reQuoteTokens  = /@fuseQuoteToken/g,
      reRegexpTokens = /@fuseRegexpToken/g,

      run = function run(code, context) {
        context || (context = global);
        if (context == global) return execute(code);

        context = getWindow(context.raw || context);
        if (context == global) return execute(code);

        // cache executer for other contexts
        var id = getFuseId(context), data = domData[id];
        return (data._evaluator || (data._evaluator = makeExecuter(context)))(code);
      },

      makeExecuter = function(context) {
        return context.Function('window',
          'return function (' + uid + '){' +
          'var arguments=window.arguments;' +
          'return ("", eval)(String(' + uid + '))}')(context);
      },

      removeHTMLComments = function(code) {
        quotes.length = regexps.length = qCounter = rCounter = 0;
        return strReplace.call(code, reQuotes, swapQuotesToTokens)
          .replace(reRegexps, swapRegexpsToTokens)
          .replace(reHTMLComments, '')
          .replace(reQuoteTokens, swapTokensToQuotes)
          .replace(reRegexpTokens, swapTokensToRegexps);
      },

      setScriptText = function(element, text) {
        (element.firstChild ||
         element.appendChild(element.ownerDocument.createTextNode('')))
         .data = text || '';
      },

      strReplace = function(pattern, replacement) {
        return (strReplace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
          plugin.replace : plugin.replace.raw).call(this, pattern, replacement);
      },

      swapQuotesToTokens = function(quote) {
        quotes.push(quote);
        return '@fuseQuoteToken';
      },

      swapRegexpsToTokens = function(regexp) {
        regexps.push(regexp);
        return '@fuseRegexpToken';
      },

      swapTokensToQuotes = function() {
        return quotes[qCounter++];
      },

      swapTokensToRegexps = function() {
        return regexps[rCounter++];
      },

      execute = makeExecuter(global);


      try {
        // Opera 9.25 can't indirectly call eval()
        global.fuse = undef;
        execute('var fuse="x"');
        if (global.fuse !== 'x') throw new EvalError;
      }
      catch (e) {
        // fallback on global.eval()
        makeExecuter = function(context) {
          return context.Function('window',
            'return function (' + uid + '){' +
            'var arguments=window.arguments;' +
            'return window.eval(String(' + uid + '))}')(context);
        };

        global.fuse = undef;
        execute = makeExecuter(global);
        execute('var fuse="x"');
      }

      if (global.fuse !== 'x') {
        // fallback on script injection
        if (isHostType(global, 'document')) {
          run = function run(code, context) {
            context || (context = global);
            return execute(code, context == global ?
              context : getWindow(context.raw || context));
          };

          execute = function(code, context) {
            var parentNode, result, script,
             text = 'fuse.' + uid + '.returned = eval(';

            if (context == global) {
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
          execute('<!--\n//-->', global);
        }
        catch (e) {
          var __execute = execute;
          execute = function(code, context) {
            return __execute(indexOf.call(code, '<!--') > -1 ?
              removeHTMLComments(code) : code, context);
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

      (global.fuse = backup).run = run;
      return run(code, context);
    };

    // prevent JScript bug with named function expressions
    var run = null;
  })();

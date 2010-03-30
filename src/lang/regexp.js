  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function(plugin) {
    var __test = plugin.test,
     __exec = plugin.exec,
     glExec = /x/.exec,
     reOptCapture = /\)[*?]/,
     FIX_LAST_INDEX = envTest('REGEXP_INCREMENTS_LAST_INDEX_AFTER_ZERO_LENGTH_MATCHES'),
     FIX_UNDEFINED_VALUES = envTest('REGEXP_EXEC_RETURN_UNDEFINED_VALUES_AS_STRINGS');

    fuse.RegExp.escape = function escape(string) {
      return fuse.String(escapeRegExpChars(string));
    };

    plugin.clone = function clone(options) {
      options = _extend({
        'global':     this.global,
        'ignoreCase': this.ignoreCase,
        'multiline':  this.multiline
      }, options);

      return fuse.RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    };

    // For IE
    // Based on work by Steve Levithan
    if (FIX_UNDEFINED_VALUES || FIX_LAST_INDEX) {
      plugin.exec = function exec(string) {
        var cache, exec = __exec;
        if (reOptCapture.test(this.source)) {
          cache = { };
          exec  = function exec(string) {
            var backup, result, pattern = this, source = pattern.source;
            if (result = __exec.call(pattern, string)) {
              // convert to non-global regexp
              if (pattern.global) {
                if (cache.source != source) {
                  cache = new RegExp(source,
                    (pattern.ignoreCase ? 'i' : '') +
                    (pattern.multiline  ? 'm' : ''));
                }
                pattern = cache;
              }

              // using `slice(result.index)` rather than `result[0]` in case
              // lookahead allowed matching due to characters outside the match
              result.input.slice(result.index).replace(pattern, function() {
                var i = -1, length = arguments.length - 2;
                while (++i < length) {
                  if (arguments[i] == null)
                    result[i] = arguments[i];
                }
              });
            }
            return result;
          };
        } else if (this.global) {
          exec = function exec(string) {
            var pattern = this, result = __exec.call(pattern, string);
            if (result && !result[0].length && result.lastIndex > result.index) {
              pattern.lastIndex--; 
            }
            return result;
          };
        }

        // lazy define
        this.exec = exec;
        return this.exec(string);
      };
    }

    // For IE
    if (FIX_LAST_INDEX) {
      plugin.test = function test(string) {
        var test = __test;
        if (this.global) {
          test = function test(string) {
            var pattern = this, match = glExec.call(pattern, string);
            if (match && !match[0].length && pattern.lastIndex > match.index) {
              pattern.lastIndex--;
            }
            return !!match;
          };
        }

        // lazy define
        this.test = test;
        return this.test(string);
      };
    }

    // alias
    plugin.match = plugin.test;

    // prevent JScript bug with named function expressions
    var clone = nil, exec = nil, escape = nil, test = nil;
  })(fuse.RegExp.plugin);

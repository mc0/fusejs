  /*---------------------------- LANG: ECMA BUGS -----------------------------*/

  (function(regPlugin, strPlugin) {
    var reOptCapture = /\)[*?]/,

    regExec = regPlugin.exec.raw,

    rawExec = regExec,

    sMap = fuse.RegExp.SPECIAL_CHARS.s,

    strReplace = strPlugin.replace.raw,

    ARRAY_CONCAT_ARGUMENTS_BUGGY = (function() {
      // true for Opera
      var array = [];
      return (function() { return array.concat &&
        array.concat(arguments).length === 2; })(1, 2);
    })(),

    ARRAY_SLICE_EXLUDES_TRAILING_UNDEFINED_INDEXES = (function() {
      // true for Opera 9.25
      var array = [1]; array[2] = 1;
      return array.slice && array.slice(0, 2).length === 1;
    })(),

    // true for IE; String#match is affected too
    REGEXP_EXEC_RETURNS_UNDEFINED_VALUES_AS_STRINGS =
      typeof /x(y)?/.exec('x')[1] === 'string',

    REGEXP_INCREMENTS_LAST_INDEX_AFTER_ZERO_LENGTH_MATCHES = (function() {
      // true for IE
      var pattern = /^/g, data = [];
      data[0] = !!pattern.test('').lastIndex;
      ''.match(pattern);
      data[1] = !!pattern.lastIndex;
      return data[0] || data[1];
    })(),

    // true for Chrome 1-2 and Opera 9.25
    STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_OR_NAN_POSITION =
      'xox'.lastIndexOf('x', -1) !== 0 ||  'xox'.lastIndexOf('x', +'x') !== 2,

    STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX = (function() {
      // true for IE
      var string = 'oxo', data = [], pattern = /x/;
      string.replace(pattern, '');
      data[0] = !!pattern.lastIndex;
      string.match(pattern);
      data[1] = !!pattern.lastIndex;
      string.search(pattern);
      data[2] = !!pattern.lastIndex;
      return data[0] || data[1] || data[2];
    })(),

    STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN = (function() {
      // true for Chrome 1
      var string = 'xy', replacement = function() { return 'o'; };
      return !(string.replace(/()/g, 'o') === 'oxoyo' &&
        string.replace(new RegExp('', 'g'), replacement) === 'oxoyo' &&
        string.replace(/(y|)/g, replacement) === 'oxoo');
    })(),

    STRING_REPLACE_PASSES_UNDEFINED_VALUES_AS_STRINGS = (function() {
      // true for Firefox
      var result;
      'x'.replace(/x(y)?/, function(x, y) { result = typeof y === 'string'; });
      return result; 
    })(),

    STRING_SPLIT_RETURNS_UNDEFINED_VALUES_AS_STRINGS = (function() {
      // true for Firefox
      var result = 'oxo'.split(/x(y)?/);
      return result.length === 3 && typeof result[1] === 'string'; 
    })(),

    STRING_SPLIT_ZERO_LENGTH_MATCH_RETURNS_NON_EMPTY_ARRAY =
      !!''.split(/^/).length,

    STRING_TRIM_INCOMPLETE = (function() {
      // true for Firefox
      var key, whitespace = '';
      for (key in sMap) whitespace += key;
      return typeof whitespace.trim !== 'function' || !!whitespace.trim();
    })();

    /*------------------------------------------------------------------------*/

    addArrayMethods.callbacks.push(function(List) {
      var plugin = List.plugin;

      // Opera's implementation of Array.prototype.concat treats a functions arguments
      // object as an array so we overwrite concat to fix it.
      // ECMA-5 15.4.4.4
      if (ARRAY_CONCAT_ARGUMENTS_BUGGY) {
        var __concat = plugin.concat;
        (plugin.concat = function concat() {
          if (this == null) throw new TypeError;

          var item, j, i = -1,
           length  = arguments.length,
           object  = Object(this),
           results = isArray(object) ? List.fromArray(object) : List(object),
           n       = results.length;

          while (++i < length) {
            item = arguments[i];
            if (isArray(item)) {
              j = 0; itemLen = item.length;
              for ( ; j < itemLen; j++, n++) {
                if (j in item) results[n] = item[j];
              }
            } else {
              results[n++] = item;
            }
          }
          return results;
        }).raw = __concat.raw;
      }

      // ECMA-5 15.4.4.10
      if (ARRAY_SLICE_EXLUDES_TRAILING_UNDEFINED_INDEXES) {
        var __slice = plugin.slice;
        (plugin.slice = function slice(start, end) {
          if (this == null) throw new TypeError;

          var endIndex, result, object = Object(this),
           length = object.length >>> 0;

          end = typeof end === 'undefined' ? length : toInteger(end);
          endIndex = end - 1;

          if (end > length || endIndex in object) {
            return __slice.call(object, start, end);
          }
          object[endIndex] = undef;
          result = __slice.call(object, start, end);
          delete object[endIndex];
          return result;
        }).raw = __slice.raw;
      }

      // prevent JScript bug with named function expressions
      var concat = nil, slice = nil;
    });

    /*------------------------------------------------------------------------*/

    // For IE
    // Based on work by Steve Levithan
    if (REGEXP_EXEC_RETURNS_UNDEFINED_VALUES_AS_STRINGS ||
        REGEXP_INCREMENTS_LAST_INDEX_AFTER_ZERO_LENGTH_MATCHES) {
      var __exec = regPlugin.exec;
      regExec =
      regPlugin.exec = function exec(string) {
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
              strReplace.call(result.input.slice(result.index), pattern, function() {
                var i = -1, length = arguments.length - 2;
                while (++i < length) {
                  if (arguments[i] === undef)
                    result[i] = undef;
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
        exec.raw || (exec.raw = __exec.raw);
        return this.exec(string);
      };
    }

    // For IE
    if (REGEXP_INCREMENTS_LAST_INDEX_AFTER_ZERO_LENGTH_MATCHES) {
      var __test = regPlugin.test;
      (regPlugin.test = function test(string) {
        var test = __test;
        if (this.global) {
          test = function test(string) {
            var pattern = this, match = rawExec.call(pattern, string);
            if (match && !match[0].length && pattern.lastIndex > match.index) {
              pattern.lastIndex--;
            }
            return !!match;
          };
        }
        // lazy define
        this.test = test;
        test.raw  = __test.raw;
        return this.test(string);
      }).raw = __test;
    }

    /*------------------------------------------------------------------------*/

    // For Chrome 1-2 and Opera 9.25
    if (STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_OR_NAN_POSITION) {
      var __lastIndexOf = strPlugin.lastIndexOf;
      (strPlugin.lastIndexOf = function lastIndexOf(searchString, position) {
        return isNaN(position)
          ? __lastIndexOf.call(this, searchString)
          : __lastIndexOf.call(this, searchString, position < 0 ? 0 : position);
      }).raw = __lastIndexOf.raw;
    }

    // ECMA-5 15.5.4.10
    // For IE
    if (STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX ||
        REGEXP_EXEC_RETURNS_UNDEFINED_VALUES_AS_STRINGS) {
      var __match = strPlugin.match;
      (strPlugin.match = function match(pattern) {
        if (isRegExp(pattern)) {
          var result = __match.call(this, pattern);
          if (!pattern.global && reOptCapture.test(pattern)) {
            // ensure undefined values are not turned to empty strings
            strReplace.call(this, pattern, function() {
              var i = -1, length = arguments.length - 2;
              while (++i < length) {
                if (arguments[i] === undef)
                  result[i] = undef;
              }
            });
          }
          pattern.lastIndex = 0;
        }
        return result;
      }).raw = __match.raw;
    }

    // ECMA-5 15.5.4.11
    // For Safari 2.0.2- and Chrome 1+
    // Based on work by Dean Edwards:
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    var __replace = strPlugin.replace;
    if (envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ||
        STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN) {
      strPlugin.replace = function replace(pattern, replacement) {
        if (typeof replacement !== 'function') {
          return __replace.call(this, pattern, replacement);
        }
        if (this == null) {
          throw new TypeError;
        }
        if (!isRegExp(pattern)) {
          pattern = new RegExp(escapeRegExpChars(pattern));
        }

        // set pattern.lastIndex to 0 before we perform string operations
        var match, index = 0, nonGlobal = !pattern.global,
         lastIndex = pattern.lastIndex = 0,
         result = '', source = String(this),
         srcLength = source.length;

        while (match = regExec.call(pattern, source)) {
          index = match.index;
          result += source.slice(lastIndex, index);

          // set lastIndex before replacement call to avoid potential
          // pattern.lastIndex tampering
          lastIndex = index + match[0].length;
          match.push(index, source);
          result += replacement.apply(global, match);
          pattern.lastIndex = lastIndex;

          if (nonGlobal) {
            break;
          }
          // handle empty pattern matches like /()/g
          if (lastIndex === index) {
            if (lastIndex === srcLength) break;
            pattern.lastIndex = lastIndex++;
            result += source.charAt(lastIndex);
          }
        }

        // append the remaining source to the result
        if (lastIndex < srcLength) {
          result += source.slice(lastIndex, srcLength);
        }
        return fuse.String(result);
      };

      strReplace = strPlugin.replace;
    }

    // For Firefox
    if (STRING_REPLACE_PASSES_UNDEFINED_VALUES_AS_STRINGS) {
      var __replace2 = strPlugin.replace;
      strPlugin.replace = function replace(pattern, replacement) {
        if (typeof replacement === 'function' && isRegExp(pattern) &&
            reOptCapture.test(pattern.source)) {
          var __replacement = replacement;
          replacement = function(match) {
            var args, backup = pattern.lastIndex, length = arguments.length;
            pattern.lastIndex = 0;
            args = regExec.call(pattern, match);
            pattern.lastIndex = backup;
            args.push(arguments[length - 2], arguments[length - 1]);
            return __replacement.apply(global, args);
          };
        }
        return __replace2.call(this, pattern, replacement);
      };
    }

    // For IE
    if (STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX) {
      var __replace3 = strPlugin.replace;
      strPlugin.replace = function replace(pattern, replacement) {
        if (typeof replacement === 'function') {
          var __replacement = replacement;
          replacement = function() {
            // ensure string `null` and `undefined` are returned
            var result = __replacement.apply(global, arguments);
            return result || String(result);
          };
        }
        var result = __replace3.call(this, pattern, replacement);
        if (isRegExp(pattern)) pattern.lastIndex = 0;
        return result;
      };

      // ECMA-5 15.5.4.12
      var __search = strPlugin.search;
      (strPlugin.search = function search(pattern) {
        var backup, result;
        if (isRegExp(pattern)) {
          backup = pattern.lastIndex;
          result = __search.call(this, pattern);
          pattern.lastIndex = backup;
          return result;
        }
        return __search.call(this, pattern);
      }).raw = __search.raw;
    }

    // ECMA-5 15.5.4.14
    // For IE and Firefox
    // Based on work by Steve Levithan
    // http://xregexp.com/
    var __split = strPlugin.split;
    if (envTest('STRING_SPLIT_BUGGY_WITH_REGEXP') ||
        STRING_SPLIT_RETURNS_UNDEFINED_VALUES_AS_STRINGS) {
      strPlugin.split = function split(separator, limit) {
        // max limit Math.pow(2, 32) - 1
        limit = typeof limit === 'undefined' ? 4294967295 : limit >>> 0;
        if (!limit || !isRegExp(separator)) {
          return __split.call(this, separator, limit);
        }

        var backup, index, lastIndex, length, match, string, strLength, j,
         i = -1, lastLastIndex = 0, results = fuse.Array();

        string = fuse.String(this);
        strLength = string.length;

        if (!separator.global) {
          separator = new RegExp(separator.source, 'g' +
            (separator.ignoreCase ? 'i' : '') +
            (separator.multiline  ? 'm' : ''));
        } else {
          backup = separator.lastIndex;
          separator.lastIndex = 0;
        }

        while (match = regExec.call(separator, string)) {
          index  = match.index;
          length = match.length;

          // set separator.lastIndex because IE may report the wrong value
          lastIndex =
          separator.lastIndex = index + match[0].length;

          // only the first match at a given position of the string is considered
          // and if the regexp can match an empty string then don't match the
          // empty substring at the beginning or end of the input string
          if (lastIndex > lastLastIndex && index < strLength) {
            results[++i] = string.slice(lastLastIndex, index);
            if (results.length === limit) return results;

            // add capture groups
            j = 0;
            while (++j < length) {
              results[++i] = match[j] == null ? match[j] : fuse.String(match[j]);
              if (results.length === limit) break;
            }
            lastLastIndex = lastIndex;
          }
          // avoid infinite loop
          if (lastIndex === index) {
            separator.lastIndex++;
          }
        }

        // don't match empty substring at end if the input string is empty
        separator.lastIndex = 0;
        if (!(strLength === 0 && separator.test(''))) {
          results[++i] = string.slice(lastLastIndex);
        }
        if (backup != null) {
          separator.lastIndex = backup;
        }
        return results;
      };
    }
    // For Chrome 1+
    else if (STRING_SPLIT_ZERO_LENGTH_MATCH_RETURNS_NON_EMPTY_ARRAY) {
      strPlugin.split = function split(separator, limit) {
        var backup, results = __split.call(this, separator, limit);
        if (results && isRegExp(separator)) {
          if (separator.global) {
            backup = separator.lastIndex;
            separator.lastIndex = 0;
          }
          if (!String(this).length && separator.test('')) {
            results.length = 0;
          }
          if (backup != null) {
            separator.lastIndex = backup;
          }
        }
        return results;
      };
    }

    // ECMA-5 15.5.4.20
    if (STRING_TRIM_INCOMPLETE) {
      var __trim = strPlugin.trim;
      (strPlugin.trim = function trim() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1, end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(++start)]) { };
        if (start === end) return fuse.String('');

        while (sMap[string.charAt(--end)]) { }
        return fuse.String(string.slice(start, end + 1));
      }).raw = __trim.raw;

      // non-standard
      var __trimLeft = strPlugin.trimLeft;
      (strPlugin.trimLeft = function trimLeft() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1;

        if (!string) return fuse.String(string);
        while (sMap[string.charAt(++start)]) { }
        return fuse.String(string.slice(start));
      }).raw = __trimLeft.raw;

      // non-standard
      var __trimRight = strPlugin.trimRight;
      (strPlugin.trimRight = function trimRight() {
        if (this == null) throw new TypeError;
        var string = String(this), end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(--end)]) { }
        return fuse.String(string.slice(0, end + 1));
      }).raw = __trimRight.raw;
    }

    strPlugin.replace.raw = __replace.raw;
    strPlugin.split.raw   = __split.raw;

    // prevent JScript bug with named function expressions
    var exec =     nil,
     lastIndexOf = nil,
     match =       nil,
     replace =     nil,
     search =      nil,
     split =       nil,
     test =        nil,
     trim =        nil,
     trimLeft =    nil,
     trimRight =   nil;
  })(fuse.RegExp.plugin, fuse.String.plugin);

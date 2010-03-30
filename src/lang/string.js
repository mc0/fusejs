  /*------------------------------ LANG: STRING ------------------------------*/

  fuse.scriptFragment = '<script[^>]*>([^\\x00]*?)<\/script>';

  fuse.addNS('util');

  (function(plugin) {
    var $w = function $w(string) {
      if (!isString(string)) return fuse.Array();
      string = plugin.trim.call(string);
      return string != '' ? string.split(/\s+/) : fuse.Array();
    },

    interpret = function interpret(value) {
      return fuse.String(value == null ? '' : value);
    };

    fuse.util.$w = $w;
    fuse.String.interpret = interpret;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var FIX_SET_LAST_INDEX =
      envTest('STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX'),

    FIX_UNDEFINED_VALUES =
      envTest('REGEXP_EXEC_RETURNS_UNDEFINED_VALUES_AS_STRINGS'),

    __lastIndexOf = plugin.lastIndexOf,
    __replace     = plugin.replace,
    __match       = plugin.match,
    __search      = plugin.search,
    __split       = plugin.split,
    exec          = FIX_UNDEFINED_VALUES ? fuse.RegExp.plugin.exec : /x/.exec,
    reOptCapture  = /\)[*?]/,
    sMap          = fuse.RegExp.SPECIAL_CHARS.s;


    // ECMA-5 15.5.4.11
    // For Safari 2.0.2- and Chrome 1+
    // Based on work by Dean Edwards:
    // http://code.google.com/p/base2/source/browse/trunk/lib/src/base2-legacy.js?r=239#174
    if (envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ||
        envTest('STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN')) {
      plugin.replace = function replace(pattern, replacement) {
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

        while (match = exec.call(pattern, source)) {
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
    }

    // For Firefox
    if (envTest('STRING_REPLACE_PASSES_UNDEFINED_VALUES_AS_STRINGS')) {
      var __replace2 = plugin.replace;
      plugin.replace = function replace(pattern, replacement) {
        if (typeof replacement === 'function' && isRegExp(pattern) &&
            reOptCapture.test(pattern.source)) {

          var __replacement = replacement;
          replacement = function(match) {
            var args, backup = pattern.lastIndex, length = arguments.length;
            pattern.lastIndex = 0;
            args = exec.call(pattern, match);
            pattern.lastIndex = backup;
            args.push(arguments[length - 2], arguments[length - 1]);
            return __replacement.apply(global, args);
          };
        }
        return __replace2.call(this, pattern, replacement);
      };
    }

    // For IE
    if (FIX_SET_LAST_INDEX) {
      var __replace3 = plugin.replace;
      plugin.replace = function replace(pattern, replacement) {
        if (typeof replacement === 'function') {
          // ensure string `null` and `undefined` are returned
          var __replacement = replacement;
          replacement = function() {
            var result = __replacement.apply(global, arguments);
            return result || String(result);
          };
        }
        var result = __replace3.call(this, pattern, replacement);
        if (isRegExp(pattern)) pattern.lastIndex = 0;
        return result;
      };
    }


    // ECMA-5 15.5.4.8
    if (!plugin.lastIndexOf) {
      plugin.lastIndexOf = function lastIndexOf(searchString, position) {
        if (this == null) throw new TypeError;
        searchString = String(searchString);

        var string = String(this), len = string.length,
         searchLen = searchString.length;

        if (searchLen > len) {
          return fuse.Number(-1);
        }

        if (position < 0) {
          position = 0;
        } else if (isNaN(position) || position > len - searchLen) {
          position = len - searchLen;
        } else {
          position = +position;
        }

        if (!searchLen) {
          return fuse.Number(position);
        }

        position++;
        while (position--) {
          if (string.slice(position, position + searchLen) === searchString)
            return fuse.Number(position);
        }
        return fuse.Number(-1);
      };
    }
    // For Chrome 1-2 and Opera 9.25
    else if (envTest('STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_OR_NAN_POSITION')) {
      plugin.lastIndexOf = function lastIndexOf(searchString, position) {
        return isNaN(position)
          ? __lastIndexOf.call(this, searchString)
          : __lastIndexOf.call(this, searchString, position < 0 ? 0 : position);
      };
    }


    // ECMA-5 15.5.4.10
    // For IE
    if (FIX_UNDEFINED_VALUES || FIX_SET_LAST_INDEX) {
      plugin.match = function match(pattern) {
        if (isRegExp(pattern)) {
          var result = __match.call(this, pattern);
          if (!pattern.global && reOptCapture.test(pattern)) {
            // ensure undefined values are not turned to empty strings
            String(this).replace(pattern, function() {
              var i = -1, length = arguments.length - 2;
              while (++i < length) {
                if (arguments[i] == null)
                  result[i] = arguments[i];
              }
            });
          }
          pattern.lastIndex = 0;
        }
        return result;
      };
    }


    // ECMA-5 15.5.4.12
    // For IE
    if (FIX_SET_LAST_INDEX) {
      plugin.search = function search(pattern) {
        var backup, result;
        if (isRegExp(pattern)) {
          backup = pattern.lastIndex;
          result = __search.call(this, pattern);
          pattern.lastIndex = backup;
          return result;
        }
        return __search.call(this, pattern);
      };
    }


    // ECMA-5 15.5.4.14
    // For IE and Firefox
    // Based on work by Steve Levithan:
    // http://xregexp.com/
    if (envTest('STRING_SPLIT_BUGGY_WITH_REGEXP') ||
        envTest('STRING_SPLIT_RETURNS_UNDEFINED_VALUES_AS_STRINGS')) {
      plugin.split = function split(separator, limit) {
        var backup, index, lastIndex, length, match, string, strLength, j,
         i = -1, lastLastIndex = 0, results = fuse.Array();

        // max limit Math.pow(2, 32) - 1
        limit = typeof limit === 'undefined' ? 4294967295 : limit >>> 0;
        if (!limit) return results;

        if (isRegExp(separator)) {
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

          while (match = exec.call(separator, string)) {
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
          if (!(strLength == 0 && separator.test(''))) {
            results[++i] = string.slice(lastLastIndex);
          }
          if (backup != null) {
            separator.lastIndex = backup;
          }
          return results;
        }

        return __split.call(this, separator, limit);
      };
    }
    // For Chrome 1+
    else if (envTest('STRING_SPLIT_ZERO_LENGTH_MATCH_RETURNS_NON_EMPTY_ARRAY')) {
      plugin.split = function split(separator, limit) {
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
    if (envTest('STRING_TRIM_INCOMPLETE')) {
      plugin.trim = function trim() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1, end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        if (start === end) return fuse.String('');

        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(start, end + 1));
      };

      // non-standard
      plugin.trimLeft = function trimLeft() {
        if (this == null) throw new TypeError;
        var string = String(this), start = -1;

        if (!string) return fuse.String(string);
        while (sMap[string.charAt(++start)]);
        return fuse.String(string.slice(start));
      };

      // non-standard
      plugin.trimRight = function trimRight() {
        if (this == null) throw new TypeError;
        var string = String(this), end = string.length;

        if (!end) return fuse.String(string);
        while (sMap[string.charAt(--end)]);
        return fuse.String(string.slice(0, end + 1));
      };
    }

    // prevent JScript bug with named function expressions
    var lastIndexOf = nil,
     match =          nil,
     replace =        nil,
     search =         nil,
     split =          nil,
     trim =           nil,
     trimLeft =       nil,
     trimRight =      nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var reBlank      = fuse.RegExp('^\\s*$'),
     reCapped        = /([A-Z]+)([A-Z][a-z])/g,
     reCamelCases    = /([a-z\d])([A-Z])/g,
     reDoubleColons  = /::/g,
     reHyphens       = /-/g,
     reHyphenated    = /-+(.)?/g,
     reOpenScriptTag = /<script/i,
     reUnderscores   = /_/g,
     reScripts       = new RegExp(fuse.scriptFragment, 'gi'),
     reHTMLComments  = new RegExp('<!--[\\x20\\t\\n\\r]*' +
       fuse.scriptFragment + '[\\x20\\t\\n\\r]*-->', 'gi'),

    repeat = function(string, count) {
      // Based on work by Yaffle and Dr. J.R.Stockton.
      // Uses the `Exponentiation by squaring` algorithm.
      // http://www.merlyn.demon.co.uk/js-misc0.htm#MLS
      if (count < 1) return '';
      if (count % 2) return repeat(string, count - 1) + string;
      var half = repeat(string, count / 2);
      return half + half;
    },

    replace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
      plugin.replace : ''.replace,

    split = envTest('STRING_SPLIT_BUGGY_WITH_REGEXP') ?
       plugin.split : ''.split,

    toUpperCase = function(match, character) {
      return character ? character.toUpperCase() : '';
    };


    plugin.blank = function blank() {
      if (this == null) throw new TypeError;
      return reBlank.test(this);
    };

    plugin.camelize = function camelize() {
      if (this == null) throw new TypeError;
      return fuse.String(replace.call(this, reHyphenated, toUpperCase));
    };

    plugin.capitalize = function capitalize() {
      if (this == null) throw new TypeError;
      var string = String(this);
      return fuse.String(string.charAt(0).toUpperCase() +
        string.slice(1).toLowerCase());
    };

    plugin.contains = function contains(pattern) {
      if (this == null) throw new TypeError;
      return String(this).indexOf(pattern) > -1;
    };

    plugin.isEmpty = function isEmpty() {
      if (this == null) throw new TypeError;
      return !String(this).length;
    };

    plugin.endsWith = function endsWith(pattern) {
      // when searching for a pattern at the end of a long string
      // indexOf(pattern, fromIndex) is faster than lastIndexOf(pattern)
      if (this == null) throw new TypeError;
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    };

    plugin.evalScripts = function evalScripts() {
      if (this == null) throw new TypeError;
      results = fuse.Array();
      fuse.String(this).extractScripts(function(script) {
        results.push(global.eval(String(script)));
      });

      return results;
    };

    plugin.extractScripts = function extractScripts(callback) {
      if (this == null) throw new TypeError;
      var match, script, striptTags,
       string = String(this), results = fuse.Array();

      if (!reOpenScriptTag.test(string)) return results;

      scriptTags = string.replace(reHTMLComments, '');
      // clear lastIndex because exec() uses it as a starting point
      reScripts.lastIndex = 0;

      if (callback) {
        while (match = reScripts.exec(scriptTags)) {
          if (script = match[1]) {
            callback(script);
            results.push(script);
          }
        }
      } else {
        while (match = reScripts.exec(scriptTags)) {
          if (script = match[1]) results.push(script);
        }
      }
      return results;
    };

    plugin.hyphenate = function hyphenate() {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(reUnderscores, '-'));
    };

    plugin.startsWith = function startsWith(pattern) {
      // when searching for a pattern at the start of a long string
      // lastIndexOf(pattern, fromIndex) is faster than indexOf(pattern)
      if (this == null) throw new TypeError;
      return !String(this).lastIndexOf(pattern, 0);
    };

    plugin.stripScripts = function stripScripts() {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(reScripts, ''));
    };

    plugin.times = function times(count) {
      if (this == null) throw new TypeError;
      return fuse.String(repeat(String(this), toInteger(count)));
    };

    plugin.toArray = function toArray() {
      if (this == null) throw new TypeError;
      return fuse.String(this).split('');
    };

    plugin.toQueryParams = function toQueryParams(separator) {
      if (this == null) throw new TypeError;
      var match = String(this).split('?'), object = fuse.Object();

      // if ? (question mark) is present and there is no query after it
      if (match.length > 1 && !match[1]) return object;

      // grab the query before the # (hash) and\or spaces
      (match = (match = match[1] || match[0]).split('#')) &&
        (match = match[0].split(' ')[0]);

      // bail if empty string
      if (!match) return object;

      var pair, key, value, index, i = -1,
       pairs  = split.call(match, separator || '&'),
       length = pairs.length;

      // iterate over key-value pairs
      while (++i < length) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (pair && index) {
          if (index != -1) {
            key = decodeURIComponent(pair.slice(0, index));
            value = pair.slice(index + 1);
            if (value) value = decodeURIComponent(value);
          } else {
            key = pair;
          }

          if (hasKey(object, key)) {
            if (!isArray(object[key])) object[key] = [object[key]];
            object[key].push(value);
          } else {
            object[key] = value;
          }
        }
      }
      return object;
    };

    plugin.truncate = function truncate(length, truncation) {
      if (this == null) throw new TypeError;
      var endIndex, string = String(this);

      length = +length;
      if (isNaN(length)) length = 30;

      if (length < string.length) {
        truncation = truncation == null ? '...' : String(truncation);
        endIndex = length - truncation.length;
        string = endIndex > 0 ? string.slice(0, endIndex) + truncation : truncation;
      }
      return fuse.String(string);
    };

    plugin.underscore = function underscore() {
      if (this == null) throw new TypeError;
      return fuse.String(String(this)
        .replace(reDoubleColons, '/')
        .replace(reCapped,       '$1_$2')
        .replace(reCamelCases,   '$1_$2')
        .replace(reHyphens,      '_').toLowerCase());
    };

    // aliases
    plugin.parseQuery = plugin.toQueryParams;

    // prevent JScript bug with named function expressions
    var blank =        nil,
      camelize =       nil,
      capitalize =     nil,
      contains =       nil,
      endsWith =       nil,
      evalScripts =    nil,
      extractScripts = nil,
      hyphenate =      nil,
      isEmpty =        nil,
      startsWith =     nil,
      stripScripts =   nil,
      toArray =        nil,
      toQueryParams =  nil,
      times =          nil,
      truncate =       nil,
      underscore =     nil;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    // Tag parsing instructions:
    // http://www.w3.org/TR/REC-xml-names/#ns-using
    var reTags = (function() {
      var name   = '[-\\w]+',
       space     = '[\\x20\\t\\n\\r]',
       eq        = space + '?=' + space + '?',
       charRef   = '&#[0-9]+;',
       entityRef = '&' + name + ';',
       reference = entityRef + '|' + charRef,
       attValue  = '"(?:[^<&"]|' + reference + ')*"|\'(?:[^<&\']|' + reference + ')*\'',
       attribute = '(?:' + name + eq + attValue + '|' + name + ')';

      return new RegExp('<'+ name + '(?:' + space + attribute + ')*' + space + '?/?>|' +
        '</' + name + space + '?>', 'g');
    })(),

    define = function() {
      var tags   = [],
       count     = 0,
       div       = fuse._div,
       container = fuse._doc.createElement('pre'),
       textNode  = container.appendChild(fuse._doc.createTextNode('')),
       reTagEnds = />/g,
       reTokens  = /@fusetoken/g,

       escapeHTML = function escapeHTML() {
         if (this == null) throw new TypeError;
         textNode.data = String(this);
         return fuse.String(container.innerHTML);
       },

       getText = function() {
         return div.textContent;
       },

       swapTagsToTokens = function(tag) {
         tags.push(tag);
         return '@fusetoken';
       },

       swapTokensToTags = function() {
         return tags[count++];
       },

       unescapeHTML = function unescapeHTML() {
         if (this == null) throw new TypeError;
         var result, tokenized, string = String(this);

         // tokenize tags before setting innerHTML then swap them after
         if (tokenized = string.indexOf('<') > -1) {
           tags.length = count = 0;
           string = plugin.replace.call(string, reTags, swapTagsToTokens);
         }

         div.innerHTML = '<pre>' + string + '<\/pre>';
         result = getText();

         return fuse.String(tokenized
           ? plugin.replace.call(result, reTokens, swapTokensToTags)
           : result);
       };


      // Safari 2.x has issues with escaping html inside a `pre`
      // element so we use the deprecated `xmp` element instead.
      textNode.data = '&';
      if (container.innerHTML !== '&amp;') {
        textNode = (container = fuse._doc.createElement('xmp'))
          .appendChild(fuse._doc.createTextNode(''));
      }
      // Safari 3.x has issues with escaping the ">" character
      textNode.data = '>';
      if (container.innerHTML !== '&gt;') {
        escapeHTML = function escapeHTML() {
          if (this == null) throw new TypeError;
          textNode.data = String(this);
          return fuse.String(container.innerHTML.replace(reTagEnds, '&gt;'));
        };
      }
      if (!envTest('ELEMENT_TEXT_CONTENT')) {
        div.innerHTML = '<pre>&lt;p&gt;x&lt;/p&gt;<\/pre>';

        if (envTest('ELEMENT_INNER_TEXT') && div.firstChild.innerText === '<p>x<\/p>') {
          getText = function() { return div.firstChild.innerText.replace(/\r/g, ''); };
        }
        else if (div.firstChild.innerHTML === '<p>x<\/p>') {
          getText = function() { return div.firstChild.innerHTML; };
        }
        else {
          getText = function() {
            var node, nodes = div.firstChild.childNodes, parts = [], i = 0;
            while (node = nodes[i++]) parts.push(node.nodeValue);
            return parts.join('');
          };
        }
      }

      // lazy define methods
      plugin.escapeHTML   = escapeHTML;
      plugin.unescapeHTML = unescapeHTML;

      return plugin[arguments[0]];
    };

    plugin.escapeHTML = function escapeHTML() {
      return define('escapeHTML').call(this);
    };

    plugin.unescapeHTML = function unescapeHTML() {
      return define('unescapeHTML').call(this);
    };

    plugin.stripTags = function stripTags() {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(reTags, ''));
    };

    // prevent JScript bug with named function expressions
    var escapeHTML = nil, stripTags = nil, unescapeHTML = nil;
  })(fuse.String.plugin);

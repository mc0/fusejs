  /*------------------------------- LANG: JSON -------------------------------*/

  /* create shared pseudo private props */

  fuse._.JSON_FILTER = /^\/\*-secure-([\s\S]*)\*\/\s*$/;

  fuse._.STRINGABLE_TYPES = { 'boolean': 1, 'object': 1, 'number': 1, 'string': 1 };

  fuse._.PROBLEM_JSON_CHARS = {
   '\u0000': '\\u0000',
   '\u00ad': '\\u00ad',
   '\u070f': '\\u070f',
   '\u17b4': '\\u17b4',
   '\u17b5': '\\u17b5',
   '\ufeff': '\\ufeff'
  };

  fuse.Object.extend(fuse._, {
    // Opera 9.25 chokes on the literal
    reProblemJSONChars: new RegExp('[\\u0000\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]', 'g'),
    reEscapedChars: /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    reOpenBrackets: /(?:^|:|,)(?:[\n\r\t\x20]*\[)+/g,
    reSafeString: /^[\],:{}\n\r\t\x20]*$/,
    reSimpleValues: /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g
  });

  // Note from json2.js:
  // Replace certain Unicode characters with escape sequences. JavaScript
  // handles many characters incorrectly, either silently deleting them, or
  // treating them as line endings.
  fuse._.escapeProblemChars = function(match) {
    return fuse._.PROBLEM_JSON_CHARS[match];
  };

  /*--------------------------------------------------------------------------*/

  (function() {

    // ES5 15.12.3
    function toJSON(value) {
      var length, result, i = -1, p = fuse._, origin = toJSON[ORIGIN],
       object = window.Object(value), classOf = p.toString.call(object),
       Object = origin.Object, String = origin.String, result = [],
       strInspect = String.prototype.inspect;

      if (!p.STRINGABLE_TYPES[typeof value]) {
        return;
      }
      switch (classOf) {
        case '[object Boolean]' : return String(value);
        case '[object Number]'  : return String(isFinite(value) ? value : 'null');
        case '[object String]'  : return strInspect.call(value, true);
        case '[object Array]'   :
          length = object.length;
          while (++i < length) {
            value = toJSON(object[i]);
            result[i] = typeof value == 'undefined' ? 'null' : value;
          }
          return String('[' + result.join(',') + ']');

        case '[object Object]' :
          // handle null
          if (value === null) {
            return String(value);
          }
          if (Object.isFunction(object.toJSON)) {
            return toJSON(object.toJSON());
          }
          Object.each(object, function(value, key) {
            if (typeof (value = toJSON(value)) != 'undefined') {
              result.push(strInspect.call(key, true) + ':' + value);
            }
          });
          return String('{' + result.join(',') + '}');

        default:
          // other objects
          if (Object.isFunction(object.toJSON)) {
            return toJSON(object.toJSON());
          }
      }
    }

    (fuse.Object.toJSON = toJSON)[ORIGIN] = fuse;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    // Note from json2.js:
    // Split the second stage into 4 regexp operations in order to work around
    // crippling inefficiencies in IE's and Safari's regexp engines.
    function isJSON() {
      var p = fuse._, string = String(this);
      return string != false && p.reSafeString.test(string
        // replace the JSON backslash pairs with '@' (a non-JSON character)
        .replace(p.reEscapedChars, '@')
        // replace all simple value tokens with ']'
        .replace(p.reSimpleValues, ']')
        // delete all open brackets that follow a colon, comma, or that begin the text
        .replace(p.reOpenBrackets, ''));
    }

    function toISOString() {
      var origin = toISOString[ORIGIN];
      return origin.String(this.getUTCFullYear() + '-' +
        origin.Number(this.getUTCMonth() + 1).toPaddedString(2) + '-' +
        this.getUTCDate().toPaddedString(2)    + 'T' +
        this.getUTCHours().toPaddedString(2)   + ':' +
        this.getUTCMinutes().toPaddedString(2) + ':' +
        this.getUTCSeconds().toPaddedString(2) + 'Z');
    }

    function unfilterJSON(filter) {
      return unfilterJSON[ORIGIN].String(this)
        .replace(filter || fuse._.JSON_FILTER, '$1');
    }

    var evalJSON = function evalJSON(sanitize) {
      var p = fuse._, json = this;
      p.reProblemJSONChars.lastIndex = 0;

      if (p.reProblemJSONChars.test(json)) {
        json = p.strReplace.call(json, p.reProblemJSONChars, p.escapeProblemJSONChars);
      }
      try {
        if (!sanitize || isJSON.call(json)) {
          return eval('(' + String(json) + ')');
        }
      } catch (e) { }

      throw new SyntaxError('Badly formed JSON string: ' +
        fuse.String.plugin.inspect.call(json));
    },

    toJSON = function toJSON(object) {
      var result = JSON.stringify(object)
      return result != null ? toJSON[ORIGIN].String(result) : result;
    };

    /*------------------------------------------------------------------------*/

    if (fuse.env.test('JSON')) {
      var __evalJSON = evalJSON;
      (fuse.Object.toJSON = toJSON)[ORIGIN] = fuse;

      evalJSON = function evalJSON(sanitize) {
        var result, p = fuse._, json = this;
        if (!sanitize) {
          try {
            result = JSON.parse(String(json));
          } catch(e) {
            result = __evalJSON.call(json);
          }
        } else {
          result = JSON.parse(String(json));
        }
        return result;
      };
    }
    if (fuse.Hash) {
      fuse.Hash.plugin.toJSON = function toJSON() {
        return this.toObject();
      };
    }
    // ES5 15.9.5.44
    if (!fuse.Object.isFunction(fuse.Date.plugin.toJSON)) {
      fuse.Date.plugin.toJSON = function toJSON() {
        return this.toISOString();
      };
    }
    // ES5 15.9.5.43
    if (!fuse.Object.isFunction(fuse.Date.plugin.toISOString)) {
      (fuse.Date.plugin.toISOString = toISOString)[ORIGIN] = fuse;
    }

    fuse.String.plugin.evalJSON = evalJSON;
    fuse.String.plugin.isJSON = isJSON;
    (fuse.String.plugin.unfilterJSON = unfilterJSON)[ORIGIN] = fuse;

  })();

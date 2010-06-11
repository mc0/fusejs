  /*------------------------------- LANG: JSON -------------------------------*/

  fuse.jsonFilter = /^\/\*-secure-([\s\S]*)\*\/\s*$/;

  (function() {
    var inspect = fuse.String.plugin.inspect,
     STRINGABLE_TYPES = { 'boolean': 1, 'object': 1, 'number': 1, 'string': 1 };

    // ES5 15.12.3
    fuse.Object.toJSON = function toJSON(value) {
      if (!STRINGABLE_TYPES[typeof value]) return;

      var length, i = -1, result = [], object = Object(value),
       classOf = toString.call(object);

      switch (classOf) {
        case '[object Boolean]': return fuse.String(value);
        case '[object Number]' : return fuse.String(isFinite(value) ? value : 'null');
        case '[object String]' : return inspect.call(value, true);
        case '[object Array]'  :
          length = object.length;
          while (++i < length) {
            value = Obj.toJSON(object[i]);
            result[i] = typeof value === 'undefined' ? 'null' : value;
          }
          return fuse.String('[' + result.join(',') + ']');

        case '[object Object]' :
          // handle null
          if (value === null) {
            return fuse.String(value);
          }
          // this is not duplicating checks, one is a type check for host objects
          // and the other is an internal [[Class]] check because Safari 3.1
          // mistakes regexp instances as typeof `function`
          if (typeof object.toJSON === 'function' &&
              isFunction(object.toJSON)) {
            return Obj.toJSON(object.toJSON());
          }
          // attempt to avoid inspecting DOM nodes.
          if (typeof object.constructor === 'function') {
            eachKey(object, function(value, key) {
              if (hasKey(object, key) &&
                  typeof (value = Obj.toJSON(value)) !== 'undefined') {
                result.push(inspect.call(key, true) + ':' + value);
              }
            });
            return fuse.String('{' + result.join(',') + '}');
          }
          break;

        default:
          // other objects
          if (typeof object.toJSON === 'function' &&
              isFunction(object.toJSON)) {
            return Obj.toJSON(object.toJSON());
          }
      }
    };

    // ES5 15.9.5.43
    if (!isFunction(fuse.Date.plugin.toISOString)) {
      fuse.Date.plugin.toISOString = function toISOString() {
        return fuse.String(this.getUTCFullYear() + '-' +
          fuse.Number(this.getUTCMonth() + 1).toPaddedString(2) + '-' +
          this.getUTCDate().toPaddedString(2)    + 'T' +
          this.getUTCHours().toPaddedString(2)   + ':' +
          this.getUTCMinutes().toPaddedString(2) + ':' +
          this.getUTCSeconds().toPaddedString(2) + 'Z');
      };
    }

    // ES5 15.9.5.44
    if (!isFunction(fuse.Date.plugin.toJSON)) {
      fuse.Date.plugin.toJSON = function toJSON() {
        return this.toISOString();
      };
    }

    if (fuse.Hash) {
      fuse.Hash.plugin.toJSON = function toJSON() {
        return this.toObject();
      };
    }

    if (envTest('JSON')) {
      fuse.Object.toJSON = function toJSON(object) {
        if (object && typeof object.toJSON === 'function') {
          object = object.toJSON();
        }
        return JSON.stringify(object);
      };
    }

    // prevent JScript bug with named function expressions
    var toJSON = nil;
  })();

  /*--------------------------------------------------------------------------*/

  // complementary JSON methods for String.plugin

  (function(plugin) {
    // Note from json2.js --
    // replace certain Unicode characters with escape sequences. JavaScript
    // handles many characters incorrectly, either silently deleting them, or
    // treating them as line endings.
    var escapeProblemChars = function(match) {
      return problemChars[match];
    },

    problemChars = { 
     '\u0000': '\\u0000',
     '\u00ad': '\\u00ad',
     '\u070f': '\\u070f',
     '\u17b4': '\\u17b4',
     '\u17b5': '\\u17b5',
     '\ufeff': '\\ufeff'
    },

    reBlank = /^[\n\r\t\x20]*$/,

    reEscapedChars = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,

    reOpenBrackets = /(?:^|:|,)(?:[\n\r\t\x20]*\[)+/g,

    reSimpleValues = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,

    reSafeString   = /^[\],:{}\n\r\t\x20]*$/,

    reProblemChars = (function() {
      var key, start, end, i = 0, length = arguments.length,
       chars = ['\\u0000', '\\u00ad', '\\u070f', '\\u17b4', '\\u17b5', '\\ufeff'];
      while (i < length) {
        start = i++; end = i++;
        while (start <= end) {
          key = String.fromCharCode(start);
          problemChars[key] = '\\u' + ('0000' + (start++).toString(16)).slice(-4);
          chars.push(problemChars[key]);
        }
      }
      // return regexp
      return new RegExp('(?:' + chars.join('|') + ')', 'g');
    })(1536, 1540,  8204, 8207,  8232, 8239,  8288, 8303,  65520, 65535);

    plugin.isJSON = function isJSON() {
      // split the second stage into 4 regexp operations in order to work around
      // crippling inefficiencies in IE's and Safari's regexp engines.
      var string = String(this);
      return !reBlank.test(string) && reSafeString.test(string
        // replace the JSON backslash pairs with '@' (a non-JSON character)
        .replace(reEscapedChars, '@')
        // replace all simple value tokens with ']'
        .replace(reSimpleValues, ']')
        // delete all open brackets that follow a colon, comma, or that begin the text
        .replace(reOpenBrackets, ''));
    };

    plugin.unfilterJSON = function unfilterJSON(filter) {
      return fuse.String(String(this).replace(filter || fuse.jsonFilter, '$1'));
    };

    plugin.evalJSON = function evalJSON(sanitize) {
      var json = plugin.unfilterJSON.call(this);
      reProblemChars.lastIndex = 0;

      if (reProblemChars.test(json)) {
        json = json.replace(reProblemChars, escapeProblemChars);
      }
      try {
        if (!sanitize || json.isJSON())
          return global.eval('(' + String(json) + ')');
      } catch (e) { }
      throw new SyntaxError('Badly formed JSON string: ' + json.inspect());
    };

    if (envTest('JSON')) {
      var __evalJSON = plugin.evalJSON;
      plugin.evalJSON = function evalJSON(sanitize) {
         var result = json = plugin.unfilterJSON.call(this);
         if (!sanitize) {
           try {
             result = JSON.parse(json);
           } catch(e) {
             result = __evalJSON.call(json);
           }
         } else {
           result = JSON.parse(json);
         }
         return result;
      };
    }

    // prevent JScript bug with named function expressions
    var evalJSON = null, isJSON = null, unfilterJSON = null;
  })(fuse.String.plugin);

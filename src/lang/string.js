  /*------------------------------ LANG: STRING ------------------------------*/

  (function(plugin) {
    var reCapped    = /([A-Z]+)([A-Z][a-z])/g,
     reCamelCases   = /([a-z\d])([A-Z])/g,
     reDoubleColons = /::/g,
     reHyphens      = /-/g,
     reHyphenated   = /-+(.)?/g,
     reUnderscores  = /_/g,
     reTrimLeft     = /^\s\s*/,
     reTrimRight    = /\s\s*$/,

    rawReplace = plugin.replace.raw,

    repeater = function(string, count) {
      // Based on work by Yaffle and Dr. J.R.Stockton.
      // Uses the `Exponentiation by squaring` algorithm.
      // http://www.merlyn.demon.co.uk/js-misc0.htm#MLS
      if (count < 1) return '';
      if (count % 2) return repeater(string, count - 1) + string;
      var half = repeater(string, count / 2);
      return half + half;
    },

    strReplace = function(pattern, replacement) {
      return (strReplace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
        plugin.replace : plugin.replace.raw).call(this, pattern, replacement);
    },

    toUpperCase = function(match, character) {
      return character ? character.toUpperCase() : '';
    };

    /*------------------------------------------------------------------------*/

    plugin.capitalize = function capitalize() {
      var string = String(this);
      return fuse.String(string.charAt(0).toUpperCase() +
        string.slice(1).toLowerCase());
    };

    plugin.clone = function clone() {
      return fuse.String(this);
    };

    plugin.contains = function contains(pattern) {
      return String(this).indexOf(pattern) > -1;
    };

    plugin.isBlank = function isBlank() {
      return String(this) == false;
    };

    plugin.isEmpty = function isEmpty() {
      return !String(this).length;
    };

    plugin.endsWith = function endsWith(pattern) {
      // when searching for a pattern at the end of a long string
      // indexOf(pattern, fromIndex) is faster than lastIndexOf(pattern)
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) == d;
    };

    plugin.hyphenate = function hyphenate() {
      return fuse.String(rawReplace.call(this, reUnderscores, '-'));
    };

    plugin.repeat = function repeat(count) {
      return fuse.String(repeater(String(this), toInteger(count)));
    };

    plugin.startsWith = function startsWith(pattern) {
      // when searching for a pattern at the start of a long string
      // lastIndexOf(pattern, fromIndex) is faster than indexOf(pattern)
      return !String(this).lastIndexOf(pattern, 0);
    };

    plugin.toArray = function toArray() {
      return fuse.String(this).split('');
    };

    plugin.toCamelCase = function camelCase() {
      return fuse.String(strReplace.call(this, reHyphenated, toUpperCase));
    };

    plugin.truncate = function truncate(length, truncation) {
      var endIndex, string = String(this);
      length = +length;

      if (isNaN(length)) {
        length = 30;
      }
      if (length < string.length) {
        truncation = truncation == null ? '...' : String(truncation);
        endIndex = length - truncation.length;
        string = endIndex > 0 ? string.slice(0, endIndex) + truncation : truncation;
      }
      return fuse.String(string);
    };

    plugin.underscore = function underscore() {
      return fuse.String(rawReplace
        .call(this, reDoubleColons, '/')
        .replace(reCapped,     '$1_$2')
        .replace(reCamelCases, '$1_$2')
        .replace(reHyphens,    '_').toLowerCase());
    };

    // ES5 15.5.4.20
    if (!isFunction(plugin.trim)) {
      plugin.trim = function trim() {
        return rawReplace.call(this, reTrimLeft, '').replace(reTrimRight, '');
      };

      plugin.trim.raw = plugin.trim;
    }
    // non-standard
    if (!isFunction(plugin.trimLeft)) {
      plugin.trimLeft = function trimLeft() {
        return rawReplace.call(this, reTrimLeft, '');
      };

      plugin.trimLeft.raw = plugin.trimLeft;
    }
    // non-standard
    if (!isFunction(plugin.trimRight)) {
      plugin.trimRight = function trimRight() {
        return rawReplace.call(this, reTrimRight, '');
      };

      plugin.trimRight.raw = plugin.trimRight;
    }

    // prevent JScript bug with named function expressions
    var capitalize = null,
      clone =        null,
      contains =     null,
      endsWith =     null,
      hyphenate =    null,
      isBlank =      null,
      isEmpty =      null,
      repeat =       null,
      startsWith =   null,
      toArray =      null,
      toCamelCase =  null
      trim =         null,
      trimLeft =     null,
      trimRight =    null,
      truncate =     null,
      underscore =   null;
  })(fuse.String.plugin);

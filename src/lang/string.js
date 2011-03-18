  /*------------------------------ LANG: STRING ------------------------------*/

  /* create shared pseudo private props */

  fuse.Object.extend(fuse._, {
    reCapped:       /([A-Z]+)([A-Z][a-z])/g,
    reCamelCases:   /([a-z\d])([A-Z])/g,
    reDoubleColons: /::/g,
    reHyphens:      /-/g,
    reHyphenated:   /-+(.)?/g,
    reUnderscores:  /_/g,
    reTrimLeft:     /^\s\s*/,
    reTrimRight:    /\s\s*$/
  });

  // Based on work by Yaffle and Dr. J.R.Stockton.
  // Uses the `Exponentiation by squaring` algorithm.
  // http://www.merlyn.demon.co.uk/js-misc0.htm#MLS
  fuse._.repeater = function(string, count) {
    var half, p = fuse._;
    if (count < 1) return '';
    if (count % 2) return p.repeater(string, count - 1) + string;
    half = p.repeater(string, count / 2);
    return half + half;
  };

  fuse._.toUpperCase = function(match, character) {
    return character ? character.toUpperCase() : '';
  };

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var ORIGIN = '__origin__';

    function capitalize() {
      var string = String(this);
      return capitalize[ORIGIN].String(string.charAt(0).toUpperCase() +
        string.slice(1).toLowerCase());
    }

    function clone() {
      return clone[ORIGIN].String(this);
    }

    function contains(pattern) {
      return String(this).indexOf(pattern) > -1;
    }

    function isBlank() {
      return String(this) == false;
    }

    function isEmpty() {
      return !String(this).length;
    }

    function endsWith(pattern) {
      // when searching for a pattern at the end of a long string
      // indexOf(pattern, fromIndex) is faster than lastIndexOf(pattern)
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) == d;
    }

    function hyphenate() {
      var p = fuse._;
      return hyphenate[ORIGIN].String(p.rawReplace.call(this, p.reUnderscores, '-'));
    }

    function repeat(count) {
      var p = fuse._;
      return repeat[ORIGIN].String(p.repeater(String(this), p.toInteger(count)));
    }

    function startsWith(pattern) {
      // when searching for a pattern at the start of a long string
      // lastIndexOf(pattern, fromIndex) is faster than indexOf(pattern)
      return !String(this).lastIndexOf(pattern, 0);
    }

    function toArray() {
      return toArray[ORIGIN].String.prototype.split.call(this, '');
    }

    function toCamelCase() {
      var p = fuse._;
      return toCamelCase[ORIGIN].String(p.strReplace.call(this, p.reHyphenated, p.toUpperCase));
    }

    function truncate(length, truncation) {
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
      return truncate[ORIGIN].String(string);
    }

    function underscore() {
      var p = fuse._;
      return underscore[ORIGIN].String(p.rawReplace
        .call(this, p.reDoubleColons, '/')
        .replace(p.reCapped, '$1_$2')
        .replace(p.reCamelCases, '$1_$2')
        .replace(p.reHyphens, '_').toLowerCase());
    }

    /*------------------------------------------------------------------------*/

    /* create ES5 method equivalents */

    // ES5 15.5.4.20
    function trim() {
      var p = fuse._, replace = trim[ORIGIN].String.prototype.replace;
      return (replace.raw || replace).call(this, p.reTrimLeft, '').replace(p.reTrimRight, '');
    }

    // non-standard
    function trimLeft() {
      var replace = trim[ORIGIN].String.prototype.replace;
      return (replace.raw || replace).call(this, fuse._.reTrimLeft, '');
    }

    // non-standard
    function trimRight() {
      var replace = trim[ORIGIN].String.prototype.replace;
      return (replace.raw || replace).call(this, fuse._.reTrimRight, '');
    }

    /*------------------------------------------------------------------------*/

    plugin.contains = contains;
    plugin.endsWith = endsWith;
    plugin.isBlank = isBlank;
    plugin.isEmpty = isEmpty;
    plugin.startsWith = startsWith;

    (plugin.capitalize = capitalize)[ORIGIN] =
    (plugin.clone = clone)[ORIGIN] =
    (plugin.hyphenate = hyphenate)[ORIGIN] =
    (plugin.repeat = repeat)[ORIGIN] =
    (plugin.toArray = toArray)[ORIGIN] =
    (plugin.toCamelCase = toCamelCase)[ORIGIN] =
    (plugin.trim = trim)[ORIGIN] =
    (plugin.trimLeft = trimLeft)[ORIGIN] =
    (plugin.trimRight = trimRight)[ORIGIN] =
    (plugin.truncate = truncate)[ORIGIN] =
    (plugin.underscore = underscore)[ORIGIN] = fuse;

    if (!fuse.Object.isFunction(plugin.trim)) {
      plugin.trim =
      trim.raw = trim;
      trim[ORIGIN] = fuse;
    }
    if (!fuse.Object.isFunction(plugin.trimLeft)) {
      plugin.trimLeft =
      trimLeft.raw = trimLeft;
      trimLeft[ORIGIN] = fuse;
    }
    if (!fuse.Object.isFunction(plugin.trimRight)) {
      plugin.trimRight =
      trimRight.raw = trimRight;
      trimRight[ORIGIN] = fuse;
    }
  })(fuse.String.plugin);

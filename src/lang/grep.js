  /*------------------------------- LANG: GREP -------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function grep(pattern, callback, thisArg) {
      var item,
          result,
          i = -1,
          Array = grep[ORIGIN].Array,
          object = Object(this),
          length = object.length >>> 0;

      if (!pattern || pattern == '' || fuse.Object.isRegExp(pattern) && !pattern.source) {
        result = Array.prototype.slice.call(object, 0);
      }
      else {
        result = Array();
        callback || (callback = fuse.Function.IDENTITY);
        if (fuse.Object.isString(pattern)) {
          pattern = new RegExp(fuse._.escapeRegExpChars(pattern));
        }
        while (++i < length) {
          if (i in object && pattern.test(object[i])) {
            result.push(callback.call(thisArg, object[i], i, object));
          }
        }
      }
      return result;
    }

    (fuse.Array.plugin.grep = grep)[ORIGIN] = fuse;
  })();

  (function() {

    var ORIGIN = '__origin__';

    function grep(pattern, callback, thisArg) {
      if (!pattern || pattern == '' || fuse.Object.isRegExp(pattern) && !pattern.source) {
        return this.toArray();
      }
      var result = grep[ORIGIN].Array();
      if (fuse.Object.isString(pattern)) {
        pattern = RegExp(fuse._.escapeRegExpChars(pattern));
      }
      callback || (callback = fuse.Function.IDENTITY);
      this._each(function(value, index, iterable) {
        if (pattern.test(value)) {
          result.push(callback.call(thisArg, value, index, iterable));
        }
      });
      return result;
    }

    if (fuse.Class.mixins.enumerable) {
      (fuse.Class.mixins.enumerable.grep = grep)[ORIGIN] = fuse;
    }
  })();

  (function() {

    function grep(pattern, callback, thisArg) {
      var key,
          pair,
          result,
          value,
          i = 0,
          pairs = this._pairs;

      if (!pattern || pattern == '' || fuse.Object.isRegExp(pattern) && !pattern.source) {
        return this.clone();
      }
      result = this.constructor();
      if (fuse.Object.isString(pattern)) {
        pattern = RegExp(fuse._.escapeRegExpChars(pattern));
      }
      callback || (callback = fuse.Function.IDENTITY);
      while (pair = pairs[i++]) {
        if (pattern.test(value = pair[1])) {
          result.set(key = pair[0], callback.call(thisArg, value, key, this));
        }
      }
      return result;
    }

    if (fuse.Hash) {
      fuse.Hash.plugin.grep = grep;
    }
  })();

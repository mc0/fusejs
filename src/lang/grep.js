  /*------------------------------- LANG: GREP -------------------------------*/

  addArrayMethods.callbacks.push(function(List) {
    var plugin = List.plugin, toArray = plugin.clone || plugin.slice;

    plugin.grep = function grep(pattern, callback, thisArg) {
      if (toArray && (!pattern || pattern == '' ||
          isRegExp(pattern) && !pattern.source)) {
        return toArray.call(this, 0);
      }

      var item, i = -1, result = List(), object = Object(this),
       length = object.length >>> 0;
      if (isString(pattern)) {
        pattern = new RegExp(escapeRegExpChars(pattern));
      }

      callback || (callback = IDENTITY);
      while (++i < length) {
        if (i in object && pattern.test(object[i]))
          result.push(callback.call(thisArg, object[i], i, object));
      }
      return result;
    };

    // prevent JScript bug with named function expressions
    var grep = null;
  });

  (function() {
    if (fuse.Class.mixins.enumerable) {
      fuse.Class.mixins.enumerable.grep = function grep(pattern, callback, thisArg) {
        if (!pattern || pattern == '' || isRegExp(pattern) &&!pattern.source) {
          return this.toArray();
        }
        var result = fuse.Array();
        if (isString(pattern)) {
          pattern = new RegExp(escapeRegExpChars(pattern));
        }
        callback || (callback = IDENTITY);
        this._each(function(value, index, iterable) {
          if (pattern.test(value))
            result.push(callback.call(thisArg, value, index, iterable));
        });
        return result;
      };
    }

    if (fuse.Hash) {
      fuse.Hash.plugin.grep = function grep(pattern, callback, thisArg) {
        if (!pattern || pattern == '' || isRegExp(pattern) && !pattern.source) {
          return this.clone();
        }
        var key, pair, value, i = 0, pairs = this._pairs, result = $H();
        if (isString(pattern)) {
          pattern = new RegExp(escapeRegExpChars(pattern));
        }
        callback || (callback = IDENTITY);
        while (pair = pairs[i++]) {
          if (pattern.test(value = pair[1]))
            result.set(key = pair[0], callback.call(thisArg, value, key, this));
        }
        return result;
      };
    }

    // prevent JScript bug with named function expressions
    var grep = null;
  })();

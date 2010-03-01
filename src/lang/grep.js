  /*------------------------------- LANG: GREP -------------------------------*/

  (function() {
    var arrPlugin = fuse.Array.plugin,
     toArray = arrPlugin.clone || arrPlugin.slice;

    arrPlugin.grep = function grep(pattern, callback, thisArg) {
      if (this == null) {
        throw new TypeError;
      }
      if (toArray && (!pattern || pattern == '' ||
          isRegExp(pattern) && !pattern.source)) {
        return toArray.call(this, 0);
      }

      var item, i = -1, results = fuse.Array(), object = Object(this),
       length = object.length >>> 0;
      if (isString(pattern)) {
        pattern = new RegExp(escapeRegExpChars(pattern));
      }

      callback || (callback = K);
      while (++i < length) {
        if (i in object && pattern.test(object[i]))
          results.push(callback.call(thisArg, object[i], i, object));
      }
      return results;
    };

    if (Enumerable) {
      Enumerable.grep = function grep(pattern, callback, thisArg) {
        if (!pattern || pattern == '' ||
            isRegExp(pattern) &&!pattern.source) {
          return this.toArray();
        }

        var results = fuse.Array();
        if (isString(pattern)) {
          pattern = new RegExp(escapeRegExpChars(pattern));
        }

        callback || (callback = K);
        this._each(function(value, index, iterable) {
          if (pattern.test(value))
            results.push(callback.call(thisArg, value, index, iterable));
        });
        return results;
      };
    }

    if (fuse.Hash) {
      fuse.Hash.plugin.grep = function grep(pattern, callback, thisArg) {
        if (!pattern || pattern == '' ||
            isRegExp(pattern) && !pattern.source) {
          return this.clone();
        }

        var key, pair, value, i = 0, pairs = this._pairs, result = new $H();
        if (isString(pattern)) {
          pattern = new RegExp(escapeRegExpChars(pattern));
        }

        callback || (callback = K);
        while (pair = pairs[i++]) {
          if (pattern.test(value = pair[1]))
            result.set(key = pair[0], callback.call(thisArg, value, key, this));
        }
        return result;
      };
    }

    // prevent JScript bug with named function expressions
    var grep = nil;
  })();

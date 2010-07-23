  /*------------------------------- LANG: RANGE ------------------------------*/

  fuse.Range = (function() {
    var Klass = function() { },

    Range = function Range(start, end, exclusive) {
      var instance = __instance || new Klass;
      __instance = null;

      instance.start     = fuse.Object(start);
      instance.end       = fuse.Object(end);
      instance.exclusive = exclusive;
      return instance;
    },

    __instance,
    __apply = Range.apply,
    __call = Range.call;

    Range.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Range.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    fuse.Class({ 'constructor': Range });
    Klass.prototype = Range.plugin;
    return Range;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var __max, __min,

    buildCache = function(thisArg, callback) {
      var c = thisArg._cache = fuse.Array(), i = 0,
       value = c.start = thisArg.start = fuse.Object(thisArg.start);

      c.end = thisArg.end = fuse.Object(thisArg.end);
      c.exclusive = thisArg.exclusive;

      if (callback) {
        while (isInRange(thisArg, value)) {
          c.push(value);
          callback(value, i++, thisArg);
          value = value.succ();
        }
      } else {
        while (isInRange(thisArg, value)) {
          c.push(value) && (value = value.succ());
        }
      }
    },

    isExpired = function(thisArg) {
      var c = thisArg._cache, result = false;
      if (!c || thisArg.start != c.start || thisArg.end != c.end) {
        result = true;
      }
      else if (thisArg.exclusive != c.exclusive) {
        c.exclusive = thisArg.exclusive;
        if (c.exclusive) {
          c.pop();
        } else {
          // add incremented last value to the range
          c.push(c[c.length - 1].succ());
        }
      }
      return result;
    },

    isInRange = function(thisArg, value) {
      if (value < thisArg.start) {
        return false;
      }
      if (thisArg.exclusive) {
        return value < thisArg.end;
      }
      return value <= thisArg.end;
    };

    plugin._each = function _each(callback) {
      if (isExpired(this)) {
        buildCache(this, callback);
      } else {
        var c = this._cache, i = 0, length = c.length;
        while (i < length) callback(c[i], i++ , this);
      }
    };

    plugin.clone = function clone() {
      return fuse.Range(this.start, this.end, this.exclusive);
    };

    plugin.max = function max(callback, thisArg) {
      var result;
      if (!callback) {
        if (isExpired(this)) buildCache(this, callback);
        result = this._cache[this._cache.length - 1];
      } else {
        result = __max.call(this, callback, thisArg);
      }
      return result;
    };

    plugin.min = function min(callback, thisArg) {
      return !callback
        ? this.start
        : __min.call(this, callback, thisArg);
    };

    plugin.size = function size() {
      var c = this._cache;
      if (isExpired(this)) {
        if (isNumber(this.start) && isNumber(this.end)) {
          return fuse.Number(this.end - this.start + (this.exclusive ? 0 : 1));
        }
        buildCache(this);
      }
      return fuse.Number(this._cache.length);
    };

    plugin.toArray = function toArray() {
      isExpired(this) && buildCache(this);
      return fuse.Array.fromArray(this._cache);
    };

    // assign any missing Enumerable methods
    (function(mixin) {
      if (mixin) {
        __max = mixin.max;
        __min = mixin.min;
        eachKey(mixin, function(value, key, object) {
          if (hasKey(object, key) && typeof plugin[key] != 'function') {
            plugin[key] = value;
          }
        });
      }
    })(fuse.Class.mixins.enumerable);

    // prevent JScript bug with named function expressions
    var _each = null, clone = null, max = null, min = null, size = null, toArray = null;
  })(fuse.Range.plugin);

  /*--------------------------------------------------------------------------*/

  (function() {
    fuse.Number.plugin.succ = function succ() {
      return fuse.Number(toInteger(this) + 1);
    };

    fuse.String.plugin.succ = function succ() {
      var index = this.length - 1;
      return fuse.String(this.slice(0, index) +
        String.fromCharCode(this.charCodeAt(index) + 1));
    };

    // prevent JScript bug with named function expressions
    var succ = null;
  })();

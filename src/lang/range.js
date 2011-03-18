  /*------------------------------- LANG: RANGE ------------------------------*/

  /* create shared pseudo private props */

  fuse.Object.extend(fuse._, {

    buildRangeCache: function(thisArg, callback) {
      var ORIGIN = '__origin__',
       c = thisArg._cache = fuse.Array(), p = fuse._, i = 0,
       Object = thisArg.clone[ORIGIN].Object,
       value = c.start = thisArg.start = Object(thisArg.start);

      c.end = thisArg.end = Object(thisArg.end);
      c.exclusive = thisArg.exclusive;

      if (callback) {
        while (p.isInRange(thisArg, value)) {
          c.push(value);
          callback(value, i++, thisArg);
          value = value.succ();
        }
      } else {
        while (p.isInRange(thisArg, value)) {
          c.push(value) && (value = value.succ());
        }
      }
    },

    isInRange: function(thisArg, value) {
      if (value < thisArg.start) {
        return false;
      }
      if (thisArg.exclusive) {
        return value < thisArg.end;
      }
      return value <= thisArg.end;
    },

    isRangeCacheExpired: function(thisArg) {
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
    }
  });

  /*--------------------------------------------------------------------------*/

  fuse.Range = (function() {

    function Klass() { }

    function Range(start, end, exclusive) {
      var instance = __instance || new Klass;
      __instance = null;

      instance.start     = fuse.Object(start);
      instance.end       = fuse.Object(end);
      instance.exclusive = exclusive;
      return instance;
    }

    Range.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Range.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    var __instance, __apply = Klass.apply, __call = Klass.call;

    fuse.Class({ 'constructor': Range });
    Klass.prototype = Range.plugin;
    return Range;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var ORIGIN = '__origin__';

    function _each(callback) {
      var c, length, i = 0, p = fuse._;
      if (p.isRangeCacheExpired(this)) {
        p.buildRangeCache(this, callback);
      } else {
        c = this._cache;
        length = c.length;
        while (i < length) callback(c[i], i++ , this);
      }
    }

    function clone() {
      return clone[ORIGIN].Range(this.start, this.end, this.exclusive);
    }

    function max(callback, thisArg) {
      var result, p = fuse._;
      if (!callback || !__max) {
        if (p.isRangeCacheExpired(this)) {
          p.buildRangeCache(this, callback);
        }
        result = this._cache[this._cache.length - 1];
      } else {
        result = __max.call(this, callback, thisArg);
      }
      return result;
    }

    function min(callback, thisArg) {
      return !callback || !__min ? this.start : __min.call(this, callback, thisArg);
    }

    function size() {
      var origin = size[ORIGIN], Number = origin.Number,
       isNumber = fuse.Object.isNumber, c = this._cache, p = fuse._;

      if (p.isRangeCacheExpired(this)) {
        if (isNumber(this.start) && isNumber(this.end)) {
          return Number(this.end - this.start + (this.exclusive ? 0 : 1));
        }
        p.buildRangeCache(this);
      }
      return Number(this._cache.length);
    }

    function toArray() {
      var p = fuse._;
      p.isRangeCacheExpired(this) && p.buildRangeCache(this);
      return toArray[ORIGIN].Array.fromArray(this._cache);
    }

    /*------------------------------------------------------------------------*/

    plugin.max = max;
    plugin.min = min;

    (plugin.clone = clone)[ORIGIN] =
    (plugin.size = size)[ORIGIN] =
    (plugin.toArray = toArray)[ORIGIN] = fuse;

    // assign missing enumerable methods
    (function(mixin) {
      if (mixin) {
        __max = mixin.max;
        __min = mixin.min;
        plugin._each = _each;
        fuse.Object.each(mixin, function(value, key, object) {
          if (!fuse.Object.isFunction(plugin[key])) {
            plugin[key] = value;
          }
        });
      }
    })(fuse.Class.mixins.enumerable);

  })(fuse.Range.plugin);

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function succ() {
      return succ[ORIGIN].Number(fuse._.toInteger(this) + 1);
    }

    (fuse.Number.plugin.succ = succ)[ORIGIN] = fuse;
  })();

  (function() {

    var ORIGIN = '__origin__';

    function succ() {
      var index = this.length - 1;
      return succ[ORIGIN].String(this.slice(0, index) +
        String.fromCharCode(this.charCodeAt(index) + 1));
    }

    (fuse.String.plugin.succ = succ)[ORIGIN] = fuse;
  })();

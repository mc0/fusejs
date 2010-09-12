  /*------------------------------ LANG: ARRAY -------------------------------*/

  (function(plugin) {

    var from =
    fuse.Array.from = function from(iterable) {
      var length, object, result, Array = from[ORIGIN].Array;
      if (!arguments.length) {
        return Array();
      }
      // Safari 2.x will crash when accessing a non-existent property of a
      // node list, not in the document, that contains a text node unless we
      // use the `in` operator
      object = Object(iterable);
      if ('toArray' in object) {
        return object.toArray();
      }
      if ('item' in object) {
        return Array.fromNodeList(iterable);
      }
      if (isString(object)) {
        object = object.split('');
      }
      if ('length' in object) {
        length = object.length >>> 0;
        result = Array(length);
        while (length--) {
          if (length in object) result[length] = object[length];
        }
        return result;
      }
      return Array.fromArray([iterable]);
    },

    fromNodeList =
    fuse.Array.fromNodeList = function fromNodeList(nodeList) {
      var i = -1, result = fromNodeList[ORIGIN].Array();
      while (result[++i] = nodeList[i]) { }
      return result.length-- && result;
    };

    /*------------------------------------------------------------------------*/

    plugin.clear = function clear() {
      var object = Object(this), length = object.length >>> 0;
      if (!isArray(object)) {
        while (length--) {
          if (length in object) delete object[length];
        }
      }
      object.length = 0;
      return object;
    };

    var clone =
    plugin.clone = function clone(deep) {
      var length, result, i = -1, object = Object(this),
       Array = clone[ORIGIN].Array;
      if (deep) {
        result = Array();
        length = object.length >>> 0;
        while (++i < length) result[i] = fuse.Object.clone(object[i], deep);
      }
      else if (isArray(object)) {
        result = object.constructor != Array
          ? Array.fromArray(object)
          : object.slice(0);
      } else {
        result = Array.from(object);
      }
      return result;
    };

    var compact =
    plugin.compact = function compact(falsy) {
      var i = -1, j = i, object = Object(this), length = object.length >>> 0,
       result = compact[ORIGIN].Array();

      if (falsy) {
        while (++i < length) {
          if (object[i] && object[i] != '') result[++j] = object[i];
        }
      } else {
        while (++i < length) {
          if (object[i] != null) result[++j] = object[i];
        }
      }
      return result;
    };

    var flatten =
    plugin.flatten = function flatten() {
      var item, i = -1, j = i, object = Object(this),
       length = object.length >>> 0,
       result = flatten[ORIGIN].Array();

      while (++i < length) {
        if (isArray(item = object[i])) {
          j = concatList(result, flatten.call(item)).length - 1;
        } else {
          result[++j] = item;
        }
      }
      return result;
    };

    var insert =
    plugin.insert = function insert(index, value) {
      var plugin = insert[ORIGIN].Array.prototype,
       slice = plugin.slice, splice = plugin.splice,
       object = Object(this), length = object.length >>> 0;

      if (length < index) object.length = index;
      if (index < 0) index = length;
      if (arguments.length > 2) {
        splice.apply(object, concatList([index, 0], slice.call(arguments, 1)));
      } else {
        splice.call(object, index, 0, value);
      }
      return object;
    };

    var unique =
    plugin.unique = function unique() {
      var item, i = -1, j = i, object = Object(this),
       length = object.length >>> 0,
       result = unique[ORIGIN].Array();

      while (++i < length) {
        if (i in object && !result.contains(item = object[i]))
          result[++j] = item;
      }
      return result;
    };

    var without =
    plugin.without = function without() {
      var args, i = -1, j = i, object = Object(this),
       length = object.length >>> 0, result = without[ORIGIN].Array(),
       indexOf = result.indexOf, slice = result.slice;

      if (length) {
        args = slice.call(arguments, 0);
        while (++i < length) {
          if (i in object && indexOf.call(args, object[i]) == -1)
            result[++j] = object[i];
        }
      }
      return result;
    };

    /* Create optimized Enumerable equivalents */

    var contains =
    plugin.contains = (function() {
      var contains = function contains(value) {
        var item, object = Object(this), length = object.length >>> 0;
        while (length--) {
          if (length in object) {
            // basic strict match
            if ((item = object[length]) === value) return true;
            // match String and Number object instances
            try { if (item.valueOf() === value.valueOf()) return true; } catch (e) { }
          }
        }
        return false;
      };

      if (isFunction(plugin.indexOf)) {
        var __contains = contains;
        contains = function contains(value) {
          // attempt a fast strict search first
          var object = Object(this);
          return contains[ORIGIN].Array.prototype.indexOf.call(object, value) > -1 ?
            true : __contains.call(object, value);
        };
      }
      return contains;
    })();

    plugin.each = function each(callback, thisArg) {
      var i = -1, object = Object(this), length = object.length >>> 0;
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      while (++i < length) {
        if (i in object && callback.call(thisArg, object[i], i, object) === false) {
          break;
        }
      }
      return this;
    };

    var first =
    plugin.first = function first(callback, thisArg) {
      var count, i = -1, Array = first[ORIGIN].Array,
       object = Object(this), length = object.length >>> 0;
      if (callback == null) {
        while (++i < length) {
          if (i in object) return object[i];
        }
      }
      else if (typeof callback == 'function') {
        while (++i < length) {
          if (callback.call(thisArg, object[i], i))
            return object[i];
        }
      }
      else {
        count = +callback; // fast coerce to number
        if (isNaN(count)) return Array();
        count = count < 1 ? 1 : count > length ? length : count;
        return Array.prototype.slice.call(object, 0, count);
      }
    };

    var inject =
    plugin.inject = (function() {
      var inject = function inject(accumulator, callback, thisArg) {
        var i = -1, object = Object(this), length = object.length >>> 0;
        if (typeof callback != 'function') {
          throw new TypeError;
        }
        while (++i < length) {
          if (i in object)
            accumulator = callback.call(thisArg, accumulator, object[i], i, object);
        }
        return accumulator;
      };

      // use Array#reduce if available
      if (isFunction(plugin.reduce)) {
        var __inject = inject;
        inject = function inject(accumulator, callback, thisArg) {
          return thisArg
            ? __inject.call(this, accumulator, callback, thisArg)
            : inject[ORIGIN].Array.prototype.reduce.call(this, callback, accumulator);
        };
      }
      return inject;
    })();

    var intersect =
    plugin.intersect = function intersect(array) {
      var item, i = -1, j = i, Array = intersect[ORIGIN].Array,
       contains = Array.prototype.contains, object = Object(this),
       length = object.length >>> 0, result = Array();

      while (++i < length) {
        if (i in object &&
            contains.call(array, item = object[i]) &&
            !result.contains(item)) {
          result[++j] = item;
        }
      }
      return result;
    };

    var invoke =
    plugin.invoke = function invoke(method) {
      var args, result = invoke[ORIGIN].Array(),
       apply = invoke.apply, call = invoke.call, slice = result.slice,
       object = Object(this), length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object)
            result[length] = call.call(object[length][method], object[length]);
        }
      } else {
        args = slice.call(arguments, 1);
        while (length--) {
          if (length in object)
            result[length] = apply.call(object[length][method], object[length], args);
        }
      }
      return result;
    };

    var last =
    plugin.last = function last(callback, thisArg) {
      var result, count, Array = last[ORIGIN].Array,
       object = Object(this), length = object.length >>> 0;

      if (callback == null) {
        return object[length && length - 1];
      }
      if (typeof callback == 'function') {
        while (length--) {
          if (callback.call(thisArg, object[length], length, object))
            return object[length];
        }
      } else {
        count = +callback;
        result = Array();
        if (isNaN(count)) return result;

        count = count < 1 ? 1 : count > length ? length : count;
        return result.slice.call(object, length - count);
      }
    };

    plugin.max = function max(callback, thisArg) {
      var result;
      if (!callback && (callback = IDENTITY) && isArray(this)) {
        // John Resig's fast Array max|min:
        // http://ejohn.org/blog/fast-javascript-maxmin
        result = Math.max.apply(Math, this);
        if (!isNaN(result)) return result;
        result = undef;
      }

      var comparable, max, value, i = -1,
       object = Object(this), length = object.length >>> 0;

      while (++i < length) {
        if (i in object) {
          comparable = callback.call(thisArg, value = object[i], i, object);
          if (max == null || comparable > max) {
            max = comparable; result = value;
          }
        }
      }
      return result;
    };

    plugin.min = function min(callback, thisArg) {
      var result;
      if (!callback && (callback = IDENTITY) && isArray(this)) {
        result = Math.min.apply(Math, this);
        if (!isNaN(result)) return result;
        result = undef;
      }

      var comparable, min, value, i = -1,
       object = Object(this), length = object.length >>> 0;

      while (++i < length) {
        if (i in object) {
          comparable = callback.call(thisArg, value = object[i], i, object);
          if (min == null || comparable < min) {
            min = comparable; result = value;
          }
        }
      }
      return result;
    };

    var partition =
    plugin.partition = function partition(callback, thisArg) {
      var item, i = -1, j = i, k = i,  Array = partition[ORIGIN].Array,
       object = Object(this), length = object.length >>> 0,
       trues = Array(), falses = Array();

      callback || (callback = fuse.Function.IDENTITY);
      while (++i < length) {
        if (i in object) {
          if (callback.call(thisArg, item = object[i], i, object)) {
            trues[++j] = item;
          } else {
            falses[++k] = item;
          }
        }
      }
      return Array(trues, falses);
    };

    var pluck =
    plugin.pluck = function pluck(property) {
      var i = -1, result = pluck[ORIGIN].Array(),
       object = Object(this), length = object.length >>> 0;

      while (++i < length) {
        if (i in object) result[i] = object[i][property];
      }
      return result;
    };

    var size =
    plugin.size = function size() {
      return size[ORIGIN].Number(Object(this).length >>> 0);
    };

    var sortBy =
    plugin.sortBy = function sortBy(callback, thisArg) {
      var value, i = -1,  array = [], object = Object(this),
       length = object.length >>> 0,
       result = sortBy[ORIGIN].Array();

      callback || (callback = fuse.Function.IDENTITY);
      while (length--) {
        value = object[length];
        array[length] = { 'value': value, 'criteria': callback.call(thisArg, value, length, object) };
      }

      array = array.sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      });

      length = array.length;
      while (++i < length) {
        if (i in array) result[i] = array[i].value;
      }
      return result;
    };

    var zip =
    plugin.zip = function zip() {
      var lists, plucked, j, k, i = -1,
       result   = zip[ORIGIN].Array(),
       args     = result.slice.call(arguments, 0),
       callback = fuse.Function.IDENTITY,
       object   = Object(this),
       length   = object.length >>> 0;

      // if last argument is a function it is the callback
      if (typeof args[args.length - 1] == 'function') {
        callback = args.pop();
      }

      lists = prependList(args, object);
      k = lists.length;

      while (++i < length) {
        j = -1; plucked = fuse.Array();
        while (++j < k) {
          if (j in lists) plucked[j] = lists[j][i];
        }
        result[i] = callback(plucked, i, object);
      }
      return result;
    };

    /*------------------------------------------------------------------------*/

    /* Use native browser JS 1.6 implementations if available */

    // ES5 15.4.4.16
    if (!isFunction(plugin.every)) {
      plugin.every = function every(callback, thisArg) {
        var i = -1, object = Object(this), length = object.length >>> 0;
        if (typeof callback != 'function') {
          throw new TypeError;
        }
        while (++i < length) {
          if (i in object && !callback.call(thisArg, object[i], i, object))
            return false;
        }
        return true;
      };

      plugin.every.raw = plugin.every;
    }

    // ES5 15.4.4.20
    if (!isFunction(plugin.filter)) {
      var filter =
      plugin.filter = function filter(callback, thisArg) {
        var i = -1, j = i, object = Object(this), length = object.length >>> 0,
         result = filter[ORIGIN].Array();

        if (typeof callback != 'function') {
          throw new TypeError;
        }
        while (++i < length) {
          if (i in object && callback.call(thisArg, object[i], i, object))
            result[++j] = object[i];
        }
        return result;
      };

      filter[ORIGIN] = fuse;
      filter.raw = plugin.filter;
    }

    // ES5 15.4.4.18
    if (!isFunction(plugin.forEach)) {
      plugin.forEach = function forEach(callback, thisArg) {
        var i = -1, object = Object(this), length = object.length >>> 0;
        while (++i < length) {
          i in object && callback.call(thisArg, object[i], i, object);
        }
      };

      plugin.forEach.raw = plugin.forEach;
    }

    // ES5 15.4.4.14
    if (!isFunction(plugin.indexOf)) {
      var indexOf =
      plugin.indexOf = function indexOf(item, fromIndex) {
        var Number = indexOf[ORIGIN].Number,
         object = Object(this), length = object.length >>> 0;

        fromIndex = toInteger(fromIndex);
        if (fromIndex < 0) fromIndex = length + fromIndex;
        fromIndex--;

        // ES5 draft oversight, should use [[HasProperty]] instead of [[Get]]
        while (++fromIndex < length) {
          if (fromIndex in object && object[fromIndex] === item)
            return Number(fromIndex);
        }
        return Number(-1);
      };

      indexOf[ORIGIN] = fuse;
      indexOf.raw = plugin.indexOf;
    }

    // ES5 15.4.4.15
    if (!isFunction(plugin.lastIndexOf)) {
      var lastIndexOf =
      plugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
        var object = Object(this), length = object.length >>> 0;
        fromIndex = fromIndex == null ? length : toInteger(fromIndex);

        if (!length) return fuse.Number(-1);
        if (fromIndex > length) fromIndex = length - 1;
        if (fromIndex < 0) fromIndex = length + fromIndex;

        // ES5 draft oversight, should use [[HasProperty]] instead of [[Get]]
        fromIndex++;
        while (--fromIndex > -1) {
          if (fromIndex in object && object[fromIndex] === item) break;
        }
        return lastIndexOf[ORIGIN].Number(fromIndex);
      };

      lastIndexOf[ORIGIN] = fuse;
      lastIndexOf.raw = plugin.lastIndexOf;
    }

    // ES5 15.4.4.19
    if (!isFunction(plugin.map)) {
      var map =
      plugin.map = function map(callback, thisArg) {
        var i = -1, object = Object(this), length = object.length >>> 0,
         result = map[ORIGIN].Array();

        if (typeof callback != 'function') {
          throw new TypeError;
        }
        while (++i < length) {
          if (i in object) result[i] = callback.call(thisArg, object[i], i, object);
        }
        return result;
      };

      map[ORIGIN] = fuse;
      map.raw = plugin.map;
    }

    // ES5 15.4.4.17
    if (!isFunction(plugin.some)) {
      plugin.some = function some(callback, thisArg) {
        var i = -1, object = Object(this), length = object.length >>> 0;
        if (typeof callback != 'function') {
          throw new TypeError;
        }
        while (++i < length) {
          if (i in object && callback.call(thisArg, object[i], i, object))
            return true;
        }
        return false;
      };

      plugin.some.raw = plugin.some;
    }

    // assign any missing Enumerable methods
    if (fuse.Class.mixins.enumerable) {
      plugin._each = function _each(callback) {
        this.forEach(callback);
        return this;
      };

      eachKey(fuse.Class.mixins.enumerable, function(value, key, object) {
        if (hasKey(object, key) && !isFunction(plugin[key])) {
          plugin[key] = value;
        }
      });
    }

    clone[ORIGIN] =
    compact[ORIGIN] =
    contains[ORIGIN] =
    first[ORIGIN] =
    flatten[ORIGIN] =
    from[ORIGIN] =
    fromNodeList[ORIGIN] =
    inject[ORIGIN] =
    insert[ORIGIN] =
    intersect[ORIGIN] =
    invoke[ORIGIN] =
    last[ORIGIN] =
    partition[ORIGIN] =
    pluck[ORIGIN] =
    size[ORIGIN] =
    sortBy[ORIGIN] =
    unique[ORIGIN] =
    without[ORIGIN] =
    zip[ORIGIN] = fuse;

    // prevent JScript bug with named function expressions
    var clear = null,
     each =     null,
     every =    null,
     forEach =  null,
     max =      null,
     min =      null,
     some =     null;
  })(fuse.Array.plugin);

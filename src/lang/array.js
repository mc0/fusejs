  /*------------------------------ LANG: ARRAY -------------------------------*/

  /* create shared pseudo private props */

  fuse._.sorter = function(left, right) {
    var a = left.criteria, b = right.criteria;
    return a < b ? -1 : a > b ? 1 : 0;
  };

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    /* create Array statics */

    function from(iterable) {
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
      if (fuse.Object.isString(object)) {
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
    }

    function fromNodeList(nodeList) {
      var i = -1, result = fromNodeList[ORIGIN].Array();
      while (result[++i] = nodeList[i]) { }
      return result.length-- && result;
    }

    /*------------------------------------------------------------------------*/

    function clear() {
      var object = Object(this), length = object.length >>> 0;
      if (!fuse.Object.isArray(object)) {
        while (length--) {
          if (length in object) delete object[length];
        }
      }
      object.length = 0;
      return object;
    }

    function clone(deep) {
      var length, result, i = -1, object = Object(this),
       Array = clone[ORIGIN].Array;
      if (deep) {
        result = Array();
        length = object.length >>> 0;
        while (++i < length) result[i] = fuse.Object.clone(object[i], deep);
      }
      else if (fuse.Object.isArray(object)) {
        result = object.constructor != Array
          ? Array.fromArray(object)
          : object.slice(0);
      } else {
        result = Array.from(object);
      }
      return result;
    }

    function compact(falsy) {
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
    }

    function flatten() {
      var item, i = -1, j = i, object = Object(this),
       length = object.length >>> 0,
       result = flatten[ORIGIN].Array();

      while (++i < length) {
        if (fuse.Object.isArray(item = object[i])) {
          j = fuse._.concatList(result, flatten.call(item)).length - 1;
        } else {
          result[++j] = item;
        }
      }
      return result;
    }

    function insert(index, value) {
      var proto = window.Array.prototype,
       slice = proto.slice, splice = proto.splice,
       object = Object(this), length = object.length >>> 0;

      if (length < index) object.length = index;
      if (index < 0) index = length;
      if (arguments.length > 2) {
        splice.apply(object, fuse._.concatList([index, 0], slice.call(arguments, 1)));
      } else {
        splice.call(object, index, 0, value);
      }
      return object;
    }

    function intersect(array) {
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
    }

    function unique() {
      var item, i = -1, j = i, object = Object(this),
       length = object.length >>> 0,
       result = unique[ORIGIN].Array();

      while (++i < length) {
        if (i in object && !result.contains(item = object[i]))
          result[++j] = item;
      }
      return result;
    }

    function without() {
      var args, i = -1, j = i, proto = window.Array.prototype,
       object = Object(this), length = object.length >>> 0,
       result = without[ORIGIN].Array(), indexOf = proto.indexOf || result.indexOf;

      if (length) {
        args = proto.slice.call(arguments, 0);
        while (++i < length) {
          if (i in object && indexOf.call(args, object[i]) == -1)
            result[++j] = object[i];
        }
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    /* create ES5 method equivalents */

    // ES5 15.4.4.16
    function every(callback, thisArg) {
      var i = -1, object = Object(this), length = object.length >>> 0;
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      while (++i < length) {
        if (i in object && !callback.call(thisArg, object[i], i, object))
          return false;
      }
      return true;
    }

    // ES5 15.4.4.20
    function filter(callback, thisArg) {
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
    }

    // ES5 15.4.4.18
    function forEach(callback, thisArg) {
      var i = -1, object = Object(this), length = object.length >>> 0;
      while (++i < length) {
        i in object && callback.call(thisArg, object[i], i, object);
      }
    }

    // ES5 15.4.4.14
    function indexOf(item, fromIndex) {
      var Number = indexOf[ORIGIN].Number,
       object = Object(this), length = object.length >>> 0;

      fromIndex = fuse._.toInteger(fromIndex);
      if (fromIndex < 0) fromIndex = length + fromIndex;
      fromIndex--;

      // ES5 draft oversight, should use [[HasProperty]] instead of [[Get]]
      while (++fromIndex < length) {
        if (fromIndex in object && object[fromIndex] === item)
          return Number(fromIndex);
      }
      return Number(-1);
    }

    // ES5 15.4.4.15
    function lastIndexOf(item, fromIndex) {
      var object = Object(this), length = object.length >>> 0;
      fromIndex = fromIndex == null ? length : fuse._.toInteger(fromIndex);

      if (!length) return fuse.Number(-1);
      if (fromIndex > length) fromIndex = length - 1;
      if (fromIndex < 0) fromIndex = length + fromIndex;

      // ES5 draft oversight, should use [[HasProperty]] instead of [[Get]]
      fromIndex++;
      while (--fromIndex > -1) {
        if (fromIndex in object && object[fromIndex] === item) break;
      }
      return lastIndexOf[ORIGIN].Number(fromIndex);
    }

    // ES5 15.4.4.19
    function map(callback, thisArg) {
      var i = -1, object = Object(this), length = object.length >>> 0,
       result = map[ORIGIN].Array();

      if (typeof callback != 'function') {
        throw new TypeError;
      }
      while (++i < length) {
        if (i in object) result[i] = callback.call(thisArg, object[i], i, object);
      }
      return result;
    }

    // ES5 15.4.4.17
    function some(callback, thisArg) {
      var i = -1, object = Object(this), length = object.length >>> 0;
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      while (++i < length) {
        if (i in object && callback.call(thisArg, object[i], i, object))
          return true;
      }
      return false;
    }

    /*------------------------------------------------------------------------*/

    /* create optimized enumerable equivalents */

    function _each(callback) {
      this.forEach(callback);
      return this;
    }

    function contains(value) {
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
    }

    function each(callback, thisArg) {
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
    }

    function first(callback, thisArg) {
      var count, i = -1, Array = first[ORIGIN].Array,
       object = Object(this), length = object.length >>> 0;
      if (callback == null) {
        while (++i < length) {
          if (i in object) return object[i];
        }
      }
      else if (typeof callback == 'function') {
        while (++i < length) {
          if (callback.call(thisArg, object[i], i)) {
            return object[i];
          }
        }
      }
      else {
        count = +callback; // fast coerce to number
        if (isNaN(count)) return Array();
        count = count < 1 ? 1 : count > length ? length : count;
        return Array.prototype.slice.call(object, 0, count);
      }
    }

    function inject(accumulator, callback, thisArg) {
      var i = -1, object = Object(this), length = object.length >>> 0;
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      while (++i < length) {
        if (i in object) {
          accumulator = callback.call(thisArg, accumulator, object[i], i, object);
        }
      }
      return accumulator;
    }

    function invoke(method) {
      var args, result = invoke[ORIGIN].Array(),
       apply = invoke.apply, call = invoke.call,
       object = Object(this), length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object)
            result[length] = call.call(object[length][method], object[length]);
        }
      } else {
        args = Array.prototype.slice.call(arguments, 1);
        while (length--) {
          if (length in object)
            result[length] = apply.call(object[length][method], object[length], args);
        }
      }
      return result;
    }

    function last(callback, thisArg) {
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
    }

    function max(callback, thisArg) {
      var result;
      if (!callback && (callback = fuse.Function.IDENTITY) && fuse.Object.isArray(this)) {
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
    }

    function min(callback, thisArg) {
      var result;
      if (!callback && (callback = fuse.Function.IDENTITY) && fuse.Object.isArray(this)) {
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
    }

    function partition(callback, thisArg) {
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
    }

    function pluck(property) {
      var i = -1, result = pluck[ORIGIN].Array(),
       object = Object(this), length = object.length >>> 0;

      while (++i < length) {
        if (i in object) result[i] = object[i][property];
      }
      return result;
    }

    function size() {
      return size[ORIGIN].Number(Object(this).length >>> 0);
    }

    function sortBy(callback, thisArg) {
      var value, i = -1,  array = [], object = Object(this),
       length = object.length >>> 0,
       result = sortBy[ORIGIN].Array();

      callback || (callback = fuse.Function.IDENTITY);
      while (length--) {
        value = object[length];
        array[length] = { 'value': value, 'criteria': callback.call(thisArg, value, length, object) };
      }

      array = array.sort(fuse._.sorter);
      length = array.length;
      while (++i < length) {
        if (i in array) result[i] = array[i].value;
      }
      return result;
    }

    function zip() {
      var lists, plucked, j, k, i = -1,
       origin   = zip[ORIGIN],
       result   = origin.Array(),
       args     = Array.prototype.slice.call(arguments, 0),
       callback = fuse.Function.IDENTITY,
       object   = Object(this),
       length   = object.length >>> 0;

      // if last argument is a function it is the callback
      if (typeof args[args.length - 1] == 'function') {
        callback = args.pop();
      }

      lists = fuse._.prependList(args, object);
      k = lists.length;

      while (++i < length) {
        j = -1;
        plucked = origin.Array();
        while (++j < k) {
          if (j in lists) plucked[j] = lists[j][i];
        }
        result[i] = callback(plucked, i, object);
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    plugin.clear = clear;
    plugin.contains = contains;
    plugin.each = each;
    plugin.inject = inject;
    plugin.insert = insert;
    plugin.max = max;
    plugin.min = min;

    from[ORIGIN] =
    fromNodeList[ORIGIN] =
    (plugin.clone = clone)[ORIGIN] =
    (plugin.compact = compact)[ORIGIN] =
    (plugin.first = first)[ORIGIN] =
    (plugin.flatten = flatten)[ORIGIN] =
    (plugin.intersect = intersect)[ORIGIN] =
    (plugin.invoke = invoke)[ORIGIN] =
    (plugin.last = last)[ORIGIN] =
    (plugin.partition = partition)[ORIGIN] =
    (plugin.pluck = pluck)[ORIGIN] =
    (plugin.size = size)[ORIGIN] =
    (plugin.sortBy = sortBy)[ORIGIN] =
    (plugin.unique = unique)[ORIGIN] =
    (plugin.without = without)[ORIGIN] =
    (plugin.zip = zip)[ORIGIN] = fuse;

    if (!fuse.Object.isFunction(plugin.every)) {
      plugin.every =
      every.raw = every;
    }
    if (!fuse.Object.isFunction(plugin.filter)) {
      plugin.filter =
      filter.raw = filter;
      filter[ORIGIN] = fuse;
    }
    if (!fuse.Object.isFunction(plugin.forEach)) {
      plugin.forEach =
      forEach.raw = forEach;
    }
    if (!fuse.Object.isFunction(plugin.indexOf)) {
      plugin.indexOf =
      indexOf.raw = indexOf;
      indexOf[ORIGIN] = fuse;
    }
    if (!fuse.Object.isFunction(plugin.lastIndexOf)) {
      plugin.lastIndexOf =
      lastIndexOf.raw = lastIndexOf;
      lastIndexOf[ORIGIN] = fuse;
    }
    if (!fuse.Object.isFunction(plugin.map)) {
      plugin.map =
      map.raw = map;
      map[ORIGIN] = fuse;
    }
    if (!fuse.Object.isFunction(plugin.some)) {
      plugin.some =
      some.raw = some;
    }

    // assign statics
    fuse.Array.from = from;
    fuse.Array.fromNodeList = fromNodeList;

    // assign missing enumerable methods
    if (fuse.Class.mixins.enumerable) {
      plugin._each = _each;
      plugin.toArray = clone;
      fuse.Object.each(fuse.Class.mixins.enumerable, function(value, key, object) {
        if (!fuse.Object.isFunction(plugin[key])) {
          plugin[key] = value;
        }
      });
    }
  })(fuse.Array.plugin);

  (function(plugin) {

    function contains(value) {
      // attempt a fast strict search first
      var object = Object(this);
      return plugin.indexOf.call(object, value) > -1 ?
        true : __contains.call(object, value);
    }

    function inject(accumulator, callback, thisArg) {
      return thisArg
        ? __inject.call(this, accumulator, callback, thisArg)
        : plugin.reduce.call(this, callback, accumulator);
    }

    var __contains = plugin.contains, __inject = plugin.inject;
    if (fuse.Object.isFunction(Array.prototype.indexOf)) {
      plugin.contains = contains;
    }
    if (fuse.Object.isFunction(Array.prototype.reduce)) {
      plugin.inject = inject;
    }
  })(fuse.Array.plugin);

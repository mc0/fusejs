  /*------------------------------ LANG: ARRAY -------------------------------*/

  addArrayMethods.callbacks.push(function(List) {

    var plugin = List.plugin,

    funcProto = Function.prototype,

    sorter = function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    };

    List.from = function from(iterable) {
      if (!iterable || iterable == '') return List();

      // Safari 2.x will crash when accessing a non-existent property of a
      // node list, not in the document, that contains a text node unless we
      // use the `in` operator
      var object = fuse.Object(iterable);
      if ('toArray' in object) return object.toArray();
      if ('item' in iterable)  return List.fromNodeList(iterable);

      var length = iterable.length >>> 0, results = List(length);
      while (length--) {
        if (length in object) results[length] = iterable[length];
      }
      return results;
    };

    List.fromNodeList = function fromNodeList(nodeList) {
      var i = -1, results = List();
      while (results[++i] = nodeList[i]) { }
      return results.length-- && results;
    };

    /*------------------------------------------------------------------------*/

    plugin._each = function _each(callback) {
      this.forEach(callback);
      return this;
    };

    plugin.clear = function clear() {
      if (this == null) throw new TypeError;
      var object = Object(this);

      if (!isArray(object)) {
        var length = object.length >>> 0;
        while (length--) {
          if (length in object) delete object[length];
        }
      }
      object.length = 0;
      return object;
    };

    plugin.clone = (function() {
      function clone() {
        var object = Object(this);
        if (this == null) throw new TypeError;

        if (isArray(object)) {
          return object.constructor !== List
            ? List.fromArray(object)
            : object.slice(0);
        }
        return List.from(object);
      }
      return clone;
    })();

    plugin.compact = function compact(falsy) {
      if (this == null) throw new TypeError;
      var i = -1, j = i, results = List(),
       object = Object(this),
       length = object.length >>> 0;

      if (falsy) {
        while (++i < length) {
          if (object[i] && object[i] != '') results[++j] = object[i];
        }
      } else {
        while (++i < length) {
          if (object[i] != null) results[++j] = object[i];
        }
      }
      return results;
    };

    plugin.flatten = function flatten() {
      if (this == null) throw new TypeError;
      var item, i = -1, j = i, results = List(),
       object = Object(this), length = object.length >>> 0;

      while (++i < length) {
        if (isArray(item = object[i])) {
          j = concatList(results, plugin.flatten.call(item)).length - 1;
        } else {
          results[++j] = item;
        }
      }
      return results;
    };

    plugin.insert = function insert(index, value) {
      if (this == null) throw new TypeError;
      var object = Object(this),
       length = object.length >>> 0;

      if (length < index) object.length = index;
      if (index < 0) index = length;
      if (arguments.length > 2) {
        plugin.splice.apply(object, concatList([index, 0], slice.call(arguments, 1)));
      } else {
        plugin.splice.call(object, index, 0, value);
      }
      return object;
    };

    plugin.unique = function unique() {
      var item, i = -1, j = i, results = List(),
       object = Object(this),
       length = object.length >>> 0;

      while (++i < length) {
        if (i in object && !results.contains(item = object[i]))
          results[++j] = item;
      }
      return results;
    };

    plugin.without = function without() {
      if (this == null) throw new TypeError;
      var args, i = -1, j = i, indexOf = plugin.indexOf,
       results = List(), object = Object(this),
       length = object.length >>> 0;

      if (length) {
        args = slice.call(arguments, 0);
        while (++i < length) {
          if (i in object && indexOf.call(args, object[i]) == -1)
            results[++j] = object[i];
        }
      }
      return results;
    };

    /* Create optimized Enumerable equivalents */

    plugin.contains = (function() {
      var contains = function contains(value) {
        if (this == null) throw new TypeError;
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

      if (typeof plugin.indexOf === 'function') {
        var __contains = contains;
        contains = function contains(value) {
          // attempt a fast strict search first
          if (this == null) throw new TypeError;
          var object = Object(this);
          return plugin.indexOf.call(object, value) > -1
            ? true
            : __contains.call(object, value);
        };
      }
      return contains;
    })();

    plugin.each = function each(callback, thisArg) {
      try {
        plugin.forEach.call(this, callback, thisArg);
      } catch (e) {
        if (e !== $break) throw e;
      }
      return this;
    };

    plugin.first = function first(callback, thisArg) {
      if (this == null) throw new TypeError;
      var i = -1, object = Object(this),
       length = object.length >>> 0;

      if (callback == null) {
        while (++i < length) {
          if (i in object) return object[i];
        }
      }
      else if (typeof callback === 'function') {
        while (++i < length) {
          if (callback.call(thisArg, object[i], i))
            return object[i];
        }
      }
      else {
        var count = +callback; // fast coerce to number
        if (isNaN(count)) return List();
        count = count < 1 ? 1 : count > length ? length : count;
        return plugin.slice.call(object, 0, count);
      }
    };

    plugin.inject = (function() {
      var inject = function inject(accumulator, callback, thisArg) {
        if (this == null) throw new TypeError;
        var i = -1, object = Object(this), length = object.length >>> 0;

        if (thisArg) {
          while (++i < length) {
            if (i in object)
              accumulator = callback.call(thisArg, accumulator, object[i], i, object);
          }
        } else {
          while (++i < length) {
            if (i in object)
              accumulator = callback(accumulator, object[i], i, object);
          }
        }
        return accumulator;
      };

      // use Array#reduce if available
      if (typeof plugin.reduce === 'function') {
        var __inject = inject;

        inject = function inject(accumulator, callback, thisArg) {
          return thisArg
            ? __inject.call(this, accumulator, callback, thisArg)
            : plugin.reduce.call(this, callback, accumulator);
        };
      }
      return inject;
    })();

    plugin.intersect = (function() {
      function intersect(array) {
        if (this == null) throw new TypeError;
        var item, i = -1, j = i, results = List(),
         object = Object(this), length = object.length >>> 0;

        while (++i < length) {
          if (i in object &&
              contains.call(array, item = object[i]) && !results.contains(item))
            results[++j] = item;
        }
        return results;
      }

      var contains = plugin.contains;
      return intersect;
    })();

    plugin.invoke = function invoke(method) {
      if (this == null) throw new TypeError;
      var args, results = fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object)
            results[length] = funcProto.call.call(object[length][method], object[length]);
        }
      } else {
        args = slice.call(arguments, 1);
        while (length--) {
          if (length in object)
            results[length] = funcProto.apply.call(object[length][method], object[length], args);
        }
      }
      return results;
    };

    plugin.last = function last(callback, thisArg) {
      if (this == null) throw new TypeError;
      var object = Object(this), length = object.length >>> 0;

      if (callback == null) {
        return object[length && length - 1];
      }
      if (typeof callback === 'function') {
        while (length--) {
          if (callback.call(thisArg, object[length], length, object))
            return object[length];
        }
      }
      else {
        var results = List(), count = +callback;
        if (isNaN(count)) return results;
        count = count < 1 ? 1 : count > length ? length : count;
        return plugin.slice.call(object, length - count);
      }
    };

    plugin.max = function max(callback, thisArg) {
      if (this == null) throw new TypeError;
      var result;

      if (!callback && (callback = K) && isArray(this)) {
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
      if (this == null) throw new TypeError;
      var result;

      if (!callback && (callback = K) && isArray(this)) {
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

    plugin.partition = function partition(callback, thisArg) {
      if (this == null) throw new TypeError;

      callback = callback || K;
      var item, i = -1, j = i, k = i,
       trues = List(), falses = List(),
       object = Object(this), length = object.length >>> 0;

      while (++i < length) {
        if (i in object) {
          if (callback.call(thisArg, item = object[i], i, object)) {
            trues[++j] = item;
          } else {
            falses[++k] = item;
          }
        }
      }
      return fuse.Array(trues, falses);
    };

    plugin.pluck = function pluck(property) {
      if (this == null) throw new TypeError;
      var i = -1, results = fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      while (++i < length) {
        if (i in object) results[i] = object[i][property];
      }
      return results;
    };

    plugin.size = function size() {
      if (this == null) throw new TypeError;
      return fuse.Number(Object(this).length >>> 0);
    };

    plugin.sortBy = function sortBy(callback, thisArg) {
      if (this == null) throw new TypeError;

      callback = callback || K;
      var value, i = -1, results = List(), array = [],
       object = Object(this),
       length = object.length >>> 0;

      while (length--) {
        value = object[length];
        array[length] = { 'value': value, 'criteria': callback.call(thisArg, value, length, object) };
      }

      array = array.sort(sorter);
      length = array.length;

      while (++i < length) {
        if (i in array) results[i] = array[i].value;
      }
      return results;
    };

    plugin.zip = function zip() {
      if (this == null) throw new TypeError;
      var lists, plucked, j, k, i = -1,
       args     = slice.call(arguments, 0),
       callback = K,
       results  = fuse.Array(),
       object   = Object(this),
       length   = object.length >>> 0;

      // if last argument is a function it is the callback
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }

      lists = prependList(args, object);
      k = lists.length;

      while (++i < length) {
        j = -1; plucked = fuse.Array();
        while (++j < k) {
          if (j in lists) plucked[j] = lists[j][i];
        }
        results[i] = callback(plucked, i, object);
      }
      return results;
    };

    /*------------------------------------------------------------------------*/

    /* Use native browser JS 1.6 implementations if available */

    // ECMA-5 15.4.4.16
    if (!plugin.every) {
      plugin.every = function every(callback, thisArg) {
        callback = callback || K;
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = -1, object = Object(this), length = object.length >>> 0;
        while (++i < length) {
          if (i in object && !callback.call(thisArg, object[i], i, object))
            return false;
        }
        return true;
      };
    }

    // ECMA-5 15.4.4.20
    if (!plugin.filter) {
      plugin.filter = function filter(callback, thisArg) {
        callback = callback || function(value) { return value != null; };
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = -1, j = i, results = List(),
         object = Object(this),
         length = object.length >>> 0;

        while (++i < length) {
          if (i in object && callback.call(thisArg, object[i], i, object))
            results[++j] = object[i];
        }
        return results;
      };

      plugin.filter.raw = plugin.filter;
    }

    // ECMA-5 15.4.4.18
    if (!plugin.forEach) {
      plugin.forEach = function forEach(callback, thisArg) {
        if (this == null || !isFunction(callback)) throw new TypeError;
        var i = -1, object = Object(this), length = object.length >>> 0;

        if (thisArg) {
          while (++i < length) {
            i in object && callback.call(thisArg, object[i], i, object);
          }
        } else {
          while (++i < length) {
            i in object && callback(object[i], i, object);
          }
        }
      };

      plugin.forEach.raw = plugin.forEach;
    }

    // ECMA-5 15.4.4.14
    if (!plugin.indexOf) {
      plugin.indexOf = function indexOf(item, fromIndex) {
        if (this == null) throw new TypeError;

        fromIndex = toInteger(fromIndex);
        var object = Object(this), length = object.length >>> 0;
        if (fromIndex < 0) fromIndex = length + fromIndex;

        // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
        fromIndex--;
        while (++fromIndex < length) {
          if (fromIndex in object && object[fromIndex] === item)
            return fuse.Number(fromIndex);
        }
        return fuse.Number(-1);
      };

      plugin.indexOf.raw = plugin.indexOf;
    }

    // ECMA-5 15.4.4.15
    if (!plugin.lastIndexOf) {
      plugin.lastIndexOf = function lastIndexOf(item, fromIndex) {
        if (this == null) throw new TypeError;
        var object = Object(this), length = object.length >>> 0;
        fromIndex = fromIndex == null ? length : toInteger(fromIndex);

        if (!length) return fuse.Number(-1);
        if (fromIndex > length) fromIndex = length - 1;
        if (fromIndex < 0) fromIndex = length + fromIndex;

        // ECMA-5 draft oversight, should use [[HasProperty]] instead of [[Get]]
        fromIndex++;
        while (--fromIndex > -1) {
          if (fromIndex in object && object[fromIndex] === item) break;
        }
        return fuse.Number(fromIndex);
      };

      plugin.lastIndexOf.raw = plugin.lastIndexOf;
    }

    // ECMA-5 15.4.4.19
    if (!plugin.map) {
      plugin.map = function map(callback, thisArg) {
        if (!callback) return plugin.clone.call(this);
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = -1, results = List(), object = Object(this),
         length = object.length >>> 0;

        if (thisArg) {
          while (++i < length) {
            if (i in object) results[i] = callback.call(thisArg, object[i], i, object);
          }
        } else {
          while (++i < length) {
            if (i in object) results[i] = callback(object[i], i, object);
          }
        }
        return results;
      };

      plugin.map.raw = plugin.map;
    }

    // ECMA-5 15.4.4.17
    if (!plugin.some) {
      plugin.some = function some(callback, thisArg) {
        callback = callback || K;
        if (this == null || !isFunction(callback)) throw new TypeError;

        var i = -1, object = Object(this), length = object.length >>> 0;
        while (++i < length) {
          if (i in object && callback.call(thisArg, object[i], i, object))
            return true;
        }
        return false;
      };

      plugin.some.raw = plugin.some;
    }

    // assign any missing Enumerable methods
    if (Enumerable) {
      eachKey(Enumerable, function(value, key, object) {
        if (hasKey(object, key) && typeof plugin[key] !== 'function') {
          plugin[key] = value;
        }
      });
    }

    // aliases
    plugin.toArray = plugin.clone;

    // prevent JScript bug with named function expressions
    var _each =     nil,
     clear =        nil,
     compact =      nil,
     each =         nil,
     every =        nil,
     filter =       nil,
     first =        nil,
     flatten =      nil,
     forEach =      nil,
     from =         nil,
     fromNodeList = nil,
     indexOf =      nil,
     insert =       nil,
     invoke =       nil,
     last =         nil,
     lastIndexOf =  nil,
     map =          nil,
     max =          nil,
     min =          nil,
     partition =    nil,
     pluck =        nil,
     size =         nil,
     some =         nil,
     sortBy =       nil,
     unique =       nil,
     without =      nil,
     zip =          nil;
  });

  addArrayMethods(fuse.Array);

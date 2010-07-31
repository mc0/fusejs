  /*------------------------------ LANG: ARRAY -------------------------------*/

  addArrayMethods.callbacks.push(function(List) {

    var plugin = List.plugin,

    funcPlugin = fuse.Function.plugin,

    funcApply  = funcPlugin.apply,

    funcCall   = funcPlugin.call,

    filterCallback = function(value) {
      return value != null;
    },

    sorter = function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    };

    List.from = function from(iterable) {
      var length, object, result;
      if (!arguments.length) return List();

      // Safari 2.x will crash when accessing a non-existent property of a
      // node list, not in the document, that contains a text node unless we
      // use the `in` operator
      object = fuse.Object(iterable);
      if ('toArray' in object) {
        return object.toArray();
      }
      if ('item' in object) {
        return List.fromNodeList(iterable);
      }
      if ('length' in object) {
        length = iterable.length >>> 0;
        result = List(length);
        while (length--) {
          if (length in object) result[length] = iterable[length];
        }
        return result;
      }
      return List.fromArray([iterable]);
    };

    List.fromNodeList = function fromNodeList(nodeList) {
      var i = -1, result = List();
      while (result[++i] = nodeList[i]) { }
      return result.length-- && result;
    };

    /*------------------------------------------------------------------------*/

    plugin.clear = function clear() {
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

    plugin.clone = function clone(deep) {
      var length, result, object = Object(this), i = -1;
      if (deep) {
        result = List();
        length = object.length >>> 0;
        while (++i < length) result[i] = fuse.Object.clone(object[i], deep);
      }
      else if (isArray(object)) {
        result = object.constructor != List
          ? List.fromArray(object)
          : object.slice(0);
      } else {
        result = List.from(object);
      }
      return result;
    };

    plugin.compact = function compact(falsy) {
      var i = -1, j = i, result = List(),
       object = Object(this),
       length = object.length >>> 0;

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

    plugin.flatten = function flatten() {
      var item, i = -1, j = i, result = List(),
       object = Object(this), length = object.length >>> 0;

      while (++i < length) {
        if (isArray(item = object[i])) {
          j = concatList(result, plugin.flatten.call(item)).length - 1;
        } else {
          result[++j] = item;
        }
      }
      return result;
    };

    plugin.insert = function insert(index, value) {
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
      var item, i = -1, j = i, result = List(),
       object = Object(this),
       length = object.length >>> 0;

      while (++i < length) {
        if (i in object && !result.contains(item = object[i]))
          result[++j] = item;
      }
      return result;
    };

    plugin.without = function without() {
      var args, i = -1, j = i, indexOf = plugin.indexOf,
       result = List(), object = Object(this),
       length = object.length >>> 0;

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

    plugin.contains = (function() {
      var contains = function contains(value) {
        var item, object = Object(this),
         length = object.length >>> 0;

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
          return plugin.indexOf.call(object, value) > -1
            ? true
            : __contains.call(object, value);
        };
      }
      return contains;
    })();

    plugin.each = function each(callback, thisArg) {
      var i = -1, object = Object(this),
       length = object.length >>> 0;

      if (thisArg) {
        while (++i < length) {
          if (i in object && callback.call(thisArg, object[i], i, object) === false) {
            break;
          }
        }
      } else {
        while (++i < length) {
          if (i in object && callback(object[i], i, object) === false) {
            break;
          }
        }
      }
      return this;
    };

    plugin.first = function first(callback, thisArg) {
      var i = -1, object = Object(this),
       length = object.length >>> 0;

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
        var count = +callback; // fast coerce to number
        if (isNaN(count)) return List();
        count = count < 1 ? 1 : count > length ? length : count;
        return plugin.slice.call(object, 0, count);
      }
    };

    plugin.inject = (function() {
      var inject = function inject(accumulator, callback, thisArg) {
        var i = -1, object = Object(this),
         length = object.length >>> 0;

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
      if (isFunction(plugin.reduce)) {
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
        var item, i = -1, j = i, result = List(),
         object = Object(this), length = object.length >>> 0;

        while (++i < length) {
          if (i in object &&
              contains.call(array, item = object[i]) &&
              !result.contains(item)) {
            result[++j] = item;
          }
        }
        return result;
      }

      var contains = plugin.contains;
      return intersect;
    })();

    plugin.invoke = function invoke(method) {
      var args, result = fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object)
            result[length] = funcCall.call(object[length][method], object[length]);
        }
      } else {
        args = slice.call(arguments, 1);
        while (length--) {
          if (length in object)
            result[length] = funcApply.call(object[length][method], object[length], args);
        }
      }
      return result;
    };

    plugin.last = function last(callback, thisArg) {
      var object = Object(this), length = object.length >>> 0;
      if (callback == null) {
        return object[length && length - 1];
      }
      if (typeof callback == 'function') {
        while (length--) {
          if (callback.call(thisArg, object[length], length, object))
            return object[length];
        }
      }
      else {
        var result = List(), count = +callback;
        if (isNaN(count)) return result;
        count = count < 1 ? 1 : count > length ? length : count;
        return plugin.slice.call(object, length - count);
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

    plugin.partition = function partition(callback, thisArg) {
      var item, i = -1, j = i, k = i,
       trues = List(), falses = List(),
       object = Object(this), length = object.length >>> 0;

      callback || (callback = IDENTITY);
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
      var i = -1, result = fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      while (++i < length) {
        if (i in object) result[i] = object[i][property];
      }
      return result;
    };

    plugin.size = function size() {
      return fuse.Number(Object(this).length >>> 0);
    };

    plugin.sortBy = function sortBy(callback, thisArg) {
      var value, i = -1, result = List(), array = [],
       object = Object(this),
       length = object.length >>> 0;

      callback || (callback = IDENTITY);
      while (length--) {
        value = object[length];
        array[length] = { 'value': value, 'criteria': callback.call(thisArg, value, length, object) };
      }

      array = array.sort(sorter);
      length = array.length;

      while (++i < length) {
        if (i in array) result[i] = array[i].value;
      }
      return result;
    };

    plugin.zip = function zip() {
      var lists, plucked, j, k, i = -1,
       args     = slice.call(arguments, 0),
       callback = IDENTITY,
       result   = fuse.Array(),
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
        callback || (callback = IDENTITY);
        if (typeof callback != 'function') throw new TypeError;

        var i = -1, object = Object(this), length = object.length >>> 0;
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
      plugin.filter = function filter(callback, thisArg) {
        callback || (callback = filterCallback);
        if (typeof callback != 'function') throw new TypeError;

        var i = -1, j = i, result = List(),
         object = Object(this),
         length = object.length >>> 0;

        while (++i < length) {
          if (i in object && callback.call(thisArg, object[i], i, object))
            result[++j] = object[i];
        }
        return result;
      };

      plugin.filter.raw = plugin.filter;
    }

    // ES5 15.4.4.18
    if (!isFunction(plugin.forEach)) {
      plugin.forEach = function forEach(callback, thisArg) {
        var i = -1, object = Object(this),
         length = object.length >>> 0;

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

    // ES5 15.4.4.14
    if (!isFunction(plugin.indexOf)) {
      plugin.indexOf = function indexOf(item, fromIndex) {
        fromIndex = toInteger(fromIndex);
        var object = Object(this), length = object.length >>> 0;
        if (fromIndex < 0) fromIndex = length + fromIndex;

        // ES5 draft oversight, should use [[HasProperty]] instead of [[Get]]
        fromIndex--;
        while (++fromIndex < length) {
          if (fromIndex in object && object[fromIndex] === item)
            return fuse.Number(fromIndex);
        }
        return fuse.Number(-1);
      };

      plugin.indexOf.raw = plugin.indexOf;
    }

    // ES5 15.4.4.15
    if (!isFunction(plugin.lastIndexOf)) {
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
        return fuse.Number(fromIndex);
      };

      plugin.lastIndexOf.raw = plugin.lastIndexOf;
    }

    // ES5 15.4.4.19
    if (!isFunction(plugin.map)) {
      plugin.map = function map(callback, thisArg) {
        if (!callback) return plugin.clone.call(this);
        if (typeof callback != 'function') throw new TypeError;

        var i = -1, result = List(), object = Object(this),
         length = object.length >>> 0;

        if (thisArg) {
          while (++i < length) {
            if (i in object) result[i] = callback.call(thisArg, object[i], i, object);
          }
        } else {
          while (++i < length) {
            if (i in object) result[i] = callback(object[i], i, object);
          }
        }
        return result;
      };

      plugin.map.raw = plugin.map;
    }

    // ES5 15.4.4.17
    if (!isFunction(plugin.some)) {
      plugin.some = function some(callback, thisArg) {
        callback || (callback = IDENTITY);
        if (typeof callback != 'function') throw new TypeError;

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

    // aliases
    plugin.toArray = plugin.clone;

    // prevent JScript bug with named function expressions
    var _each =     null,
     clear =        null,
     clone =        null,
     compact =      null,
     each =         null,
     every =        null,
     filter =       null,
     first =        null,
     flatten =      null,
     forEach =      null,
     from =         null,
     fromNodeList = null,
     indexOf =      null,
     insert =       null,
     invoke =       null,
     last =         null,
     lastIndexOf =  null,
     map =          null,
     max =          null,
     min =          null,
     partition =    null,
     pluck =        null,
     size =         null,
     some =         null,
     sortBy =       null,
     unique =       null,
     without =      null,
     zip =          null;
  });

  addArrayMethods(fuse.Array);

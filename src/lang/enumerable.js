  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  fuse.Class.mixins.enumerable = { };

  (function(mixin) {
    var $break = function $break() { };

    mixin.contains = function contains(value) {
      var result = 0;
      this.each(function(item) {
        // basic strict match
        if (item === value && result++) return false; 
        // match String and Number object instances
        try {
          if (item.valueOf() === value.valueOf() && result++) return false;
        } catch (e) { }
      });

      return !!result;
    };

    mixin.each = function each(callback, thisArg) {
      try {
        this._each(function(value, index, iterable) {
          if (callback.call(thisArg, value, index, iterable) === false)
            throw $break;
        });
      } catch (e) {
        if (e != $break) throw e;
      }
      return this;
    };

    mixin.eachSlice = function eachSlice(size, callback, thisArg) {
      var index = -size, slices = fuse.Array(), list = this.toArray();
      if (size < 1) return list;
      while ((index += size) < list.length) {
        slices[slices.length] = list.slice(index, index + size);
      }
      return callback
        ? slices.map(callback, thisArg)
        : slices;
    };

    mixin.every = function every(callback, thisArg) {
      callback || (callback = IDENTITY);
      var result = true;
      this.each(function(value, index, iterable) {
        if (!callback.call(thisArg, value, index, iterable)) {
          return (result = false);
        }
      });
      return result;
    };

    mixin.filter = function filter(callback, thisArg) {
      var result = fuse.Array();
      callback = callback || function(value) { return value != null; };
      this._each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable))
          result.push(value);
      });
      return result;
    };

    mixin.first = function first(callback, thisArg) {
      if (callback == null) {
        var result;
        this.each(function(value) { result = value; return false; });
        return result;
      }
      return this.toArray().first(callback, thisArg);
    };

    mixin.inGroupsOf = function inGroupsOf(size, filler) {
      filler = typeof filler == 'undefined' ? null : filler;
      return this.eachSlice(size, function(slice) {
        while (slice.length < size) slice.push(filler);
        return slice;
      });
    };

    mixin.inject = function inject(accumulator, callback, thisArg) {
      this._each(function(value, index, iterable) {
        accumulator = callback.call(thisArg, accumulator, value, index, iterable);
      });
      return accumulator;
    };

    mixin.invoke = function invoke(method) {
      var args = slice.call(arguments, 1), funcProto = Function.prototype;
      return this.map(function(value) {
        return funcProto.apply.call(value[method], value, args);
      });
    };

    mixin.last = function last(callback, thisArg) {
      return this.toArray().last(callback, thisArg);
    };

    mixin.map = function map(callback, thisArg) {
      if (!callback) return this.toArray();
      var result = fuse.Array();
      if (thisArg) {
        this._each(function(value, index, iterable) {
          result.push(callback.call(thisArg, value, index, iterable));
        });
      } else {
        this._each(function(value, index, iterable) {
          result.push(callback(value, index, iterable));
        });
      }
      return result;
    };

    mixin.max = function max(callback, thisArg) {
      callback || (callback = IDENTITY);
      var comparable, max, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (max == null || comparable > max) {
          max = comparable; result = value;
        }
      });
      return result;
    };

    mixin.min = function min(callback, thisArg) {
      callback || (callback = IDENTITY);
      var comparable, min, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (min == null || comparable < min) {
          min = comparable; result = value;
        }
      });
      return result;
    };

    mixin.partition = function partition(callback, thisArg) {
      callback || (callback = IDENTITY);
      var trues = fuse.Array(), falses = fuse.Array();
      this._each(function(value, index, iterable) {
        (callback.call(thisArg, value, index, iterable) ?
          trues : falses).push(value);
      });
      return fuse.Array(trues, falses);
    };

    mixin.pluck = function pluck(property) {
      return this.map(function(value) {
        return value[property];
      });
    };

    mixin.size = function size() {
      return fuse.Number(this.toArray().length);
    };

    mixin.some = function some(callback, thisArg) {
      callback || (callback = IDENTITY);
      var result = false;
      this.each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable)) {
          return !(result = true);
        }
      });
      return result;
    };

    mixin.sortBy = function sortBy(callback, thisArg) {
      return this.map(function(value, index, iterable) {
        return {
          'value': value,
          'criteria': callback.call(thisArg, value, index, iterable)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    };

    mixin.toArray = function toArray() {
      var result = fuse.Array();
      this._each(function(value, index) { result[index] = value; });
      return result;
    };

    mixin.zip = function zip() {
      var j, length, lists, plucked, callback = IDENTITY,
       args = slice.call(arguments, 0);

      // if last argument is a function it is the callback
      if (typeof args[args.length-1] == 'function') {
        callback = args.pop();
      }

      lists = prependList(args, this.toArray());
      length = lists.length;

      return this.map(function(value, index, iterable) {
        j = -1; plucked = fuse.Array();
        while (++j < length) {
          if (j in lists) plucked[j] = lists[j][index];
        }
        return callback(plucked, index, iterable);
      });
    };

    // prevent JScript bug with named function expressions
    var contains = null,
     each =        null,
     eachSlice =   null,
     every =       null,
     filter =      null,
     first =       null,
     inject =      null,
     inGroupsOf =  null,
     invoke =      null,
     last =        null,
     map =         null,
     max =         null,
     min =         null,
     partition =   null,
     pluck =       null,
     size =        null,
     some =        null,
     sortBy =      null,
     toArray =     null,
     zip =         null;
  })(fuse.Class.mixins.enumerable);

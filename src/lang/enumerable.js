  /*---------------------------- LANG: ENUMERABLE ----------------------------*/

  fuse.Class.mixins.enumerable = { };

  (function(mixin) {

    var $break = function() { };

    function contains(value) {
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
    }

    function each(callback, thisArg) {
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      try {
        this._each(function(value, index, iterable) {
          if (callback.call(thisArg, value, index, iterable) === false)
            throw $break;
        });
      } catch (e) {
        if (e != $break) throw e;
      }
      return this;
    }

    function eachSlice(size, callback, thisArg) {
      var index = -size, slices = fuse.Array(), list = this.toArray();
      if (size < 1) return list;
      while ((index += size) < list.length) {
        slices[slices.length] = list.slice(index, index + size);
      }
      return callback
        ? slices.map(callback, thisArg)
        : slices;
    }

    function every(callback, thisArg) {
      var result = true;
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      this.each(function(value, index, iterable) {
        if (!callback.call(thisArg, value, index, iterable)) {
          return (result = false);
        }
      });
      return result;
    }

    function filter(callback, thisArg) {
      var result = fuse.Array();
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      this._each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable))
          result.push(value);
      });
      return result;
    }

    function first(callback, thisArg) {
      if (callback == null) {
        var result;
        this.each(function(value) { result = value; return false; });
        return result;
      }
      return this.toArray().first(callback, thisArg);
    }

   function inGroupsOf(size, filler) {
      filler = typeof filler == 'undefined' ? null : filler;
      return this.eachSlice(size, function(slice) {
        while (slice.length < size) slice.push(filler);
        return slice;
      });
    }

    function inject(accumulator, callback, thisArg) {
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      this._each(function(value, index, iterable) {
        accumulator = callback.call(thisArg, accumulator, value, index, iterable);
      });
      return accumulator;
    }

    function invoke(method) {
      var args = Array.prototype.slice.call(arguments, 1), funcProto = Function.prototype;
      return this.map(function(value) {
        return funcProto.apply.call(value[method], value, args);
      });
    }

    function last(callback, thisArg) {
      return this.toArray().last(callback, thisArg);
    }

    function map(callback, thisArg) {
      var result = fuse.Array();
      if (typeof callback != 'function') {
        throw new TypeError;
      }
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
    }

    function max(callback, thisArg) {
      callback || (callback = fuse.Function.IDENTITY);
      var comparable, max, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (max == null || comparable > max) {
          max = comparable; result = value;
        }
      });
      return result;
    }

    function min(callback, thisArg) {
      callback || (callback = fuse.Function.IDENTITY);
      var comparable, min, result;
      this._each(function(value, index, iterable) {
        comparable = callback.call(thisArg, value, index, iterable);
        if (min == null || comparable < min) {
          min = comparable; result = value;
        }
      });
      return result;
    }

    function partition(callback, thisArg) {
      callback || (callback = fuse.Function.IDENTITY);
      var trues = fuse.Array(), falses = fuse.Array();
      this._each(function(value, index, iterable) {
        (callback.call(thisArg, value, index, iterable) ?
          trues : falses).push(value);
      });
      return fuse.Array(trues, falses);
    }

    function pluck(property) {
      return this.map(function(value) {
        return value[property];
      });
    }

    function size() {
      return fuse.Number(this.toArray().length);
    }

    function some(callback, thisArg) {
      var result = false;
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      this.each(function(value, index, iterable) {
        if (callback.call(thisArg, value, index, iterable)) {
          return !(result = true);
        }
      });
      return result;
    }

    function sortBy(callback, thisArg) {
      return this.map(function(value, index, iterable) {
        return {
          'value': value,
          'criteria': callback.call(thisArg, value, index, iterable)
        };
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }).pluck('value');
    }

    function toArray() {
      var result = fuse.Array();
      this._each(function(value, index) { result[index] = value; });
      return result;
    }

    function zip() {
      var j, length, lists, plucked, callback = fuse.Function.IDENTITY,
       args = Array.prototype.slice.call(arguments, 0);

      // if last argument is a function it is the callback
      if (typeof args[args.length-1] == 'function') {
        callback = args.pop();
      }

      lists = fuse._.prependList(args, this.toArray());
      length = lists.length;

      return this.map(function(value, index, iterable) {
        j = -1; plucked = fuse.Array();
        while (++j < length) {
          if (j in lists) plucked[j] = lists[j][index];
        }
        return callback(plucked, index, iterable);
      });
    }

    mixin.contains = contains;
    mixin.each = each;
    mixin.eachSlice = eachSlice;
    mixin.every = every;
    mixin.filter = filter;
    mixin.first = first;
    mixin.inGroupsOf = inGroupsOf;
    mixin.inject = inject;
    mixin.invoke = invoke;
    mixin.last = last;
    mixin.map = map;
    mixin.max = max;
    mixin.min = min;
    mixin.partition = partition;
    mixin.pluck = pluck;
    mixin.size = size;
    mixin.some = some;
    mixin.sortBy = sortBy;
    mixin.toArray = toArray;
    mixin.zip = zip;

  })(fuse.Class.mixins.enumerable);

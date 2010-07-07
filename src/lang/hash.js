  /*------------------------------- LANG: HASH -------------------------------*/

  fuse.Hash = (function() {
    var Klass = function() { },

    Hash = function Hash(object) {
      return setWithObject((new Klass).clear(), object);
    },

    merge = function merge(object) {
      return setWithObject(this.clone(), object);
    },

    set = function set(key, value) {
      return isString(key)
        ? setValue(this, key, value)
        : setWithObject(this, key);
    },

    unset = function unset(key) {
      var data = this._data, i = -1,
       keys = isArray(key) ? key : arguments;

      while (key = keys[++i])  {
        if ((uid + key) in data)
          unsetByIndex(this, indexOfKey(this, key));
      }
      return this;
    },

    indexOfKey = function(hash, key) {
      key = String(key);
      var i = -1, keys = hash._keys, length = keys.length;
      while (++i < length) {
        if (keys[i] == key) return i;
      }
    },

    setValue = function(hash, key, value) {
      if (!key.length) return hash;
      var data = hash._data, uidKey = uid + key, keys = hash._keys;

      // avoid a method call to Hash#hasKey
      if (uidKey in data) {
        unsetByIndex(hash, indexOfKey(hash, key));
      }

      keys.push(key = fuse.String(key));

      hash._pairs.push(fuse.Array(key, value));
      hash._values.push(value);

      hash._data[uidKey] =
      hash._object[key] = value;
      return hash;
    },

    setWithObject = function(hash, object) {
      if (isHash(object)) {
        var pair, i = -1, pairs = object._pairs;
        while (pair = pairs[++i]) setValue(hash, pair[0], pair[1]);
      }
      else {
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) setValue(hash, key, value);
        });
      }
      return hash;
    },

    unsetByIndex = function(hash, index) {
      var keys = hash._keys;
      delete hash._data[uid + keys[index]];
      delete hash._object[keys[index]];

      keys.splice(index, 1);
      hash._pairs.splice(index, 1);
      hash._values.splice(index, 1);
    };

    fuse.Class({ 'constructor': Hash, 'merge': merge, 'set': set, 'unset': unset });
    Klass.prototype = Hash.plugin;
    return Hash;
  })();

  fuse.Hash.from = fuse.Hash;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    function _returnPair(pair) {
      var key, value;
      pair = fuse.Array(key = pair[0], value = pair[1]);
      pair.key = key;
      pair.value = value;
      return pair;
    }

    plugin.first = function first(callback, thisArg) {
      var pair, i = -1, pairs = this._pairs;
      if (callback == null) {
        if (pairs.length) return _returnPair(pairs[0]);
      }
      else if (typeof callback === 'function') {
        while (pair = pairs[++i]) {
          if (callback.call(thisArg, pair[1], pair[0], this))
            return _returnPair(pair);
        }
      }
      else {
        var count = +callback, result = fuse.Array();
        if (isNaN(count)) return result;
        count = count < 1 ? 1 : count;
        while (++i < count && (pair = pairs[i])) result[i] = _returnPair(pair);
        return result;
      }
    };

    plugin.last = function last(callback, thisArg) {
      var pair, i = -1, pairs = this._pairs, length = pairs.length;
      if (callback == null) {
        if (length) return _returnPair(this._pairs.last());
      }
      else if (typeof callback === 'function') {
        while (length--) {
          pair = pairs[length];
          if (callback.call(thisArg, pair[1], pair[2], this))
            return _returnPair(pair);
        }
      }
      else {
        var count = +callback, result = fuse.Array();
        if (isNaN(count)) return result;
        count = count < 1 ? 1 : count > length ? length : count;
        var  pad = length - count;
        while (++i < count)
          result[i] = _returnPair(pairs[pad + i]);
        return result;
      }
    };

    // prevent JScript bug with named function expressions
    var _each = null, first = null, last = null;
  })(fuse.Hash.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin, $H) {
    plugin.clear = function clear() {
      this._data   = { };
      this._object = { };
      this._keys   = fuse.Array();
      this._pairs  = fuse.Array();
      this._values = fuse.Array();
      return this;
    };

    plugin.clone = function clone(deep) {
      var result, pair, pairs, i = -1;
      if (deep) {
        result = $H();
        pairs  = this._pairs;
        while (pair = pairs[++i]) {
          result.set(pair[0], fuse.Object.clone(pair[1], deep));
        }
      } else {
        result = $H(this);
      }
      return result;
    };

    plugin.contains = function contains(value) {
      var item, pair, i = -1, pairs = this._pairs;
      while (pair = pairs[++i]) {
        // basic strict match
        if ((item = pair[1]) === value) return true;
        // match String and Number object instances
        try { if (item.valueOf() === value.valueOf()) return true; } catch (e) { }
      }
      return false;
    };

    plugin.filter = function filter(callback, thisArg) {
      var key, pair, value, i = -1, pairs = this._pairs, result = $H();
      callback = callback || function(value) { return value != null; };

      while (pair = pairs[++i]) {
        if (callback.call(thisArg, value = pair[1], key = pair[0], this))
          result.set(key, value);
      }
      return result;
    };

    plugin.get = function get(key) {
      return this._data[uid + key];
    };

    plugin.hasKey = (function() {
      function hasKey(key) { return (uid + key) in this._data; }
      return hasKey;
    })();

    plugin.keyOf = function keyOf(value) {
      var pair, i = -1, pairs = this._pairs;
      while (pair = pairs[++i]) {
        if (value === pair[1])
          return pair[0];
      }
      return fuse.Number(-1);
    };

    plugin.keys = function keys() {
      return fuse.Array.fromArray(this._keys);
    };

    plugin.map = function map(callback, thisArg) {
      if (!callback) return this;
      var key, pair, i = -1, pairs = this._pairs, result = $H();

      if (thisArg) {
        while (pair = pairs[++i])
          result.set(key = pair[0], callback.call(thisArg, pair[1], key, this));
      } else {
        while (pair = pairs[++i])
          result.set(key = pair[0], callback(pair[1], key, this));
      }
      return result;
    };

    plugin.partition = function partition(callback, thisArg) {
      callback || (callback = IDENTITY);
      var key, value, pair, i = -1, pairs = this._pairs,
       trues = $H(), falses = $H();

      while (pair = pairs[++i]) {
        (callback.call(thisArg, value = pair[1], key = pair[0], this) ?
          trues : falses).set(key, value);
      }
      return fuse.Array(trues, falses);
    };

    plugin.size = function size() {
      return fuse.Number(this._keys.length);
    };

    plugin.toArray = function toArray() {
      return fuse.Array.fromArray(this._pairs);
    };

    plugin.toObject = function toObject() {
      var pair, i = -1, pairs = this._pairs, result = fuse.Object();
      while (pair = pairs[++i]) result[pair[0]] = pair[1];
      return result;
    };

    plugin.values = function values() {
      return fuse.Array.fromArray(this._values);
    };

    plugin.zip = function zip() {
      var j, key, length, pair, pairs, values, i = -1,
       args     = slice.call(arguments, 0),
       callback = IDENTITY,
       hashes   = [this],
       pairs    = this._pairs,
       result   = $H();

      // if last argument is a function it is the callback
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }

      length = args.length;
      while (length--) {
        hashes[length + 1] = $H(args[length]);
      }

      length = hashes.length;
      while (pair = pairs[++i]) {
        j = -1; values = fuse.Array(); key = pair[0];
        while (++j < length) values[j] = hashes[j]._data[uid + key];
        result.set(key, callback(values, key, this));
      }
      return result;
    };

    // prevent JScript bug with named function expressions
    var clear =  null,
     clone =     null,
     contains =  null,
     filter =    null,
     get =       null,
     keys =      null,
     keyOf =     null,
     map =       null,
     partition = null,
     size =      null,
     toArray =   null,
     toObject =  null,
     values =    null,
     zip =       null;
  })(fuse.Hash.plugin, fuse.Hash);

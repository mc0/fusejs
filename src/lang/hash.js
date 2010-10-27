  /*------------------------------- LANG: HASH -------------------------------*/

  fuse.Hash = (function() {

    function Klass() { }

    function Hash(object) {
      return setWithObject((new Klass).clear(), object);
    }

    function merge(object) {
      return setWithObject(this.clone(), object);
    }

    function set(key, value) {
      return fuse.Object.isString(key)
        ? setValue(this, key, value)
        : setWithObject(this, key);
    }

    function unset(key) {
      var data = this._data, i = -1,
       keys = fuse.Object.isArray(key) ? key : arguments;

      while (key = keys[++i])  {
        if ((fuse.uid + key) in data)
          unsetByIndex(this, indexOfKey(this, key));
      }
      return this;
    }

    function indexOfKey(hash, key) {
      key = String(key);
      var i = -1, keys = hash._keys, length = keys.length;
      while (++i < length) {
        if (keys[i] == key) return i;
      }
    }

    function setValue(hash, key, value) {
      if (!key.length) return hash;
      var data = hash._data, uidKey = fuse.uid + key, keys = hash._keys;

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
    }

    function setWithObject(hash, object) {
      if (fuse.Object.isHash(object)) {
        var pair, i = -1, pairs = object._pairs;
        while (pair = pairs[++i]) setValue(hash, pair[0], pair[1]);
      }
      else {
        fuse.Object.each(object, function(value, key) {
          setValue(hash, key, value);
        });
      }
      return hash;
    }

    function unsetByIndex(hash, index) {
      var keys = hash._keys;
      delete hash._data[fuse.uid + keys[index]];
      delete hash._object[keys[index]];

      keys.splice(index, 1);
      hash._pairs.splice(index, 1);
      hash._values.splice(index, 1);
    }

    fuse.Class({ 'constructor': Hash, 'merge': merge, 'set': set, 'unset': unset });
    Klass.prototype = Hash.plugin;
    return Hash;
  })();

  fuse.Hash.from = fuse.Hash;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    function clear() {
      this._data   = { };
      this._object = { };
      this._keys   = fuse.Array();
      this._pairs  = fuse.Array();
      this._values = fuse.Array();
      return this;
    }

    function clone(deep) {
      var result, pair, pairs, i = -1, origin = clone[ORIGIN];
      if (deep) {
        result = origin.Hash();
        pairs  = this._pairs;
        while (pair = pairs[++i]) {
          result.set(pair[0], origin.Object.clone(pair[1], deep));
        }
      } else {
        result = origin.Hash(this);
      }
      return result;
    }

    function get(key) {
      return this._data[fuse.uid + key];
    }

    function hasKey(key) {
      return (fuse.uid + key) in this._data;
    }

    function keyOf(value) {
      var pair, i = -1, pairs = this._pairs;
      while (pair = pairs[++i]) {
        if (value === pair[1])
          return pair[0];
      }
      return keyOf[ORIGIN].Number(-1);
    }

    function keys() {
      return keys[ORIGIN].Array.fromArray(this._keys);
    }

    function toObject() {
      var pair, i = -1, pairs = this._pairs, result = toObject[ORIGIN].Object();
      while (pair = pairs[++i]) result[pair[0]] = pair[1];
      return result;
    }

    function values() {
      return values[ORIGIN].Array.fromArray(this._values);
    }

    /*------------------------------------------------------------------------*/

    /* create optimized enumerable equivalents */

    function contains(value) {
      var item, pair, i = -1, pairs = this._pairs;
      while (pair = pairs[++i]) {
        // basic strict match
        if ((item = pair[1]) === value) return true;
        // match String and Number object instances
        try { if (item.valueOf() === value.valueOf()) return true; } catch (e) { }
      }
      return false;
    }

    function filter(callback, thisArg) {
      var key, pair, value, i = -1, pairs = this._pairs,
       result = this.constructor();

      if (typeof callback != 'function') {
        throw new TypeError;
      }
      while (pair = pairs[++i]) {
        if (callback.call(thisArg, value = pair[1], key = pair[0], this))
          result.set(key, value);
      }
      return result;
    }

    function first(callback, thisArg) {
      var count, pair, result, i = -1,
       p = fuse._, pairs = this._pairs;

      if (callback == null) {
        if (pairs.length) return p.returnPair(pairs[0]);
      }
      else if (typeof callback == 'function') {
        while (pair = pairs[++i]) {
          if (callback.call(thisArg, pair[1], pair[0], this))
            return p.returnPair(pair);
        }
      }
      else {
        count  = +callback;
        result = first[ORIGIN].Array();
        if (!isNaN(count)) {
          count = count < 1 ? 1 : count;
          while (++i < count && (pair = pairs[i])) result[i] = p.returnPair(pair);
        }
        return result;
      }
    }

    function last(callback, thisArg) {
      var count, pad, pair, result, i = -1,
       p = fuse._, pairs = this._pairs, length = pairs.length;

      if (callback == null) {
        if (length) return p.returnPair(this._pairs.last());
      }
      else if (typeof callback == 'function') {
        while (length--) {
          pair = pairs[length];
          if (callback.call(thisArg, pair[1], pair[2], this))
            return p.returnPair(pair);
        }
      }
      else {
        count = +callback;
        result = last[ORIGIN].Array();
        if (!isNaN(count)) {
          count = count < 1 ? 1 : count > length ? length : count;
          pad = length - count;
          while (++i < count)
            result[i] = p.returnPair(pairs[pad + i]);
        }
        return result;
      }
    }

    function map(callback, thisArg) {
      var key, pair, i = -1, pairs = this._pairs, result = this.constructor();
      if (typeof callback != 'function') {
        throw new TypeError;
      }
      while (pair = pairs[++i]) {
        result.set(key = pair[0], callback.call(thisArg, pair[1], key, this));
      }
      return result;
    }

    function partition(callback, thisArg) {
      callback || (callback = fuse.Function.IDENTITY);
      var key, value, pair, i = -1, origin = partition[ORIGIN],
       pairs = this._pairs, trues = origin.Hash(), falses = origin.Hash();

      while (pair = pairs[++i]) {
        (callback.call(thisArg, value = pair[1], key = pair[0], this) ?
          trues : falses).set(key, value);
      }
      return origin.Array(trues, falses);
    }

    function size() {
      return size[ORIGIN].Number(this._keys.length);
    }

    function toArray() {
      return toArray[ORIGIN].Array.fromArray(this._pairs);
    }

    function zip() {
      var j, key, length, pair, pairs, values, i = -1,
       origin   = zip[ORIGIN],
       hashes   = [this],
       pairs    = this._pairs,
       args     = hashes.slice.call(arguments, 0),
       callback = fuse.Function.IDENTITY,
       result   = origin.Hash();

      // if last argument is a function it is the callback
      if (typeof args[args.length - 1] == 'function') {
        callback = args.pop();
      }

      length = args.length;
      while (length--) {
        hashes[length + 1] = origin.Hash(args[length]);
      }

      length = hashes.length;
      while (pair = pairs[++i]) {
        j = -1; values = origin.Array(); key = pair[0];
        while (++j < length) values[j] = hashes[j]._data[fuse.uid + key];
        result.set(key, callback(values, key, this));
      }
      return result;
    }

    /*------------------------------------------------------------------------*/

    plugin.clear = clear;
    plugin.contains = contains;
    plugin.filter = filter;
    plugin.get = get;
    plugin.hasKey = hasKey;
    plugin.map = map;

    (plugin.clone = clone)[ORIGIN] =
    (plugin.first = first)[ORIGIN] =
    (plugin.keyOf = keyOf)[ORIGIN] =
    (plugin.keys = keys)[ORIGIN] =
    (plugin.last = last)[ORIGIN] =
    (plugin.partition = partition)[ORIGIN] =
    (plugin.size = size)[ORIGIN] =
    (plugin.toArray = toArray)[ORIGIN] =
    (plugin.toObject = toObject)[ORIGIN] =
    (plugin.values = values)[ORIGIN] =
    (plugin.zip = zip)[ORIGIN] = fuse;

  })(fuse.Hash.plugin);

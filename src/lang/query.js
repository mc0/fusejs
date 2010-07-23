  /*------------------------------ LANG: QUERY -------------------------------*/

  (function() {

    var split = envTest('STRING_SPLIT_BUGGY_WITH_REGEXP') ?
      fuse.String.plugin.split : fuse.String.plugin.split.raw,

    toQueryPair = function(key, value) {
      return fuse.String(typeof value == 'undefined' ? key :
        key + '=' + encodeURIComponent(value == null ? '' : value));
    };

    fuse.Object.toQueryString = function toQueryString(object) {
      var result = [];
      eachKey(object, function(value, key) {
        if (hasKey(object, key)) {
          key = encodeURIComponent(key);
          if (value && isArray(value)) {
            var i = result.length, j = 0, length = i + value.length;
            while (i < length) result[i++] = toQueryPair(key, value[j++]);
          }
          else if (!value || toString.call(value) != '[object Object]') {
            result.push(toQueryPair(key, value));
          }
        }
      });
      return fuse.String(result.join('&'));
    };

    fuse.String.plugin.toQueryParams = function toQueryParams(separator) {
      // grab query after the ? (question mark) and before the # (hash) and\or spaces
      var match = String(this).split('?'), object = fuse.Object();
      if (match.length > 1 && !match[1] ||
          !((match = (match = match[1] || match[0]).split('#')) &&
          (match = match[0].split(' ')[0]))) {
        // bail if there is no query
        return object;
      }

      var pair, key, value, index, i = -1,
       pairs  = split.call(match, separator || '&'),
       length = pairs.length;

      // iterate over key-value pairs
      while (++i < length) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (pair && index) {
          if (index != -1) {
            key = decodeURIComponent(pair.slice(0, index));
            value = pair.slice(index + 1);
            if (value) value = decodeURIComponent(value);
          } else {
            key = pair;
          }
          if (hasKey(object, key)) {
            if (!isArray(object[key])) object[key] = [object[key]];
            object[key].push(value);
          } else {
            object[key] = value;
          }
        }
      }
      return object;
    };

    if (fuse.Hash) {
      fuse.Hash.plugin.toQueryString = function toQueryString() {
        return fuse.Object.toQueryString(this._object);
      };
    }

    // prevent JScript bug with named function expressions
    var toQueryParams = null, toQueryString = null;
  })();

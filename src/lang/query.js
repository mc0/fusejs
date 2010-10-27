  /*------------------------------ LANG: QUERY -------------------------------*/

  /* create shared pseudo private props */

  fuse._.toQueryPair = function(origin, key, value) {
    return origin.String(typeof value == 'undefined' ? key :
      key + '=' + encodeURIComponent(value == null ? '' : value));
  };

  /*--------------------------------------------------------------------------*/

  (function(Object) {

    function toQueryString(object) {
      var p = fuse._, origin = toQueryString[ORIGIN],
       isArray = Object.isArray, result = [];

      Object.each(object, function(value, key) {
        var i, length, j = 0;
        key = encodeURIComponent(key);

        if (value && isArray(value)) {
          i = result.length;
          length = i + value.length;
          while (i < length) {
            result[i++] = p.toQueryPair(origin, key, value[j++]);
          }
        }
        else if (!value || p.toString.call(value) != '[object Object]') {
          result.push(p.toQueryPair(origin, key, value));
        }
      });
      return origin.String(result.join('&'));
    }

    function toQueryParams(separator) {
      var index, key, length, pair, pairs, value, i = -1,
       match = String(this).split('?'), result = toQueryParams[ORIGIN].Object();

      // grab query after the ? (question mark) and before the # (hash) and\or spaces
      if (match.length > 1 && !match[1] ||
          !((match = (match = match[1] || match[0]).split('#')) &&
          (match = match[0].split(' ')[0]))) {
        // bail if there is no query
        return result;
      }

      pairs = match.split(separator || '&');
      length = pairs.length;

      // iterate over key-value pairs
      while (++i < length) {
        value = undef;
        index = (pair = pairs[i]).indexOf('=');
        if (pair && index) {
          if (index != -1) {
            key = decodeURIComponent(pair.slice(0, index));
            if (value = pair.slice(index + 1)) {
              value = decodeURIComponent(value);
            }
          } else {
            key = pair;
          }
          if (Object.hasKey(result, key)) {
            if (!Object.isArray(result[key])) {
              result[key] = [result[key]];
            }
            result[key].push(value);
          } else {
            result[key] = value;
          }
        }
      }
      return result;
    }

    (fuse.Object.toQueryString = toQueryString)[ORIGIN] =
    (fuse.String.plugin.toQueryParams = toQueryParams)[ORIGIN] = fuse;

  })(fuse.Object);

  /*--------------------------------------------------------------------------*/

  (function() {

    function toQueryString() {
      return toQueryString[ORIGIN].Object.toQueryString(this._object);
    }

    if (fuse.Hash) {
      (fuse.Hash.plugin.toQueryString = toQueryString)[ORIGIN] = fuse;
    }
  })();

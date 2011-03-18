  /*----------------------------- LANG: INSPECT ------------------------------*/

  /* create shared pseudo private props */

  fuse.Object.extend(fuse._, {

    // charCodes 0-31 and \ and '
    reWithSingleQuotes: /[\x00-\x1f\\']/g,

    // charCodes 0-31 and \ and "
    reWithDoubleQuotes: /[\x00-\x1f\\"]/g,

    // escaped chars lookup
    SPECIAL_CHARS: {
      '\b': '\\b',
      '\f': '\\f',
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\\': '\\\\',
      '"' : '\\"',
      "'" : "\\'"
    }
  });

  fuse._.inspectPlugin = function(plugin) {
    var result, backup = plugin.inspect, uid = fuse.uid;
    plugin.inspect = uid;
    result = fuse.Object.inspect(plugin).replace(uid, String(backup));
    plugin.inspect = backup;
    return result;
  };

  fuse._.escapeSpecialChars = function(match) {
    return fuse._.SPECIAL_CHARS[match];
  };

  // populate SPECIAL_CHARS with control characters
  (function(p, i, key) {
    while (--i) {
      key = String.fromCharCode(i);
      if (!p.SPECIAL_CHARS[key]) {
        p.SPECIAL_CHARS[key] = '\\u' + ('0000' + i.toString(16)).slice(-4);
      }
    }
  })(fuse._, 32);

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function inspect() {
      var length, object, result, p = fuse._,
       origin = inspect[ORIGIN], proto = (origin.Array || origin.NodeList).prototype;

      // called by Obj.inspect on fuse.Array/fuse.dom.NodeList or its plugin object
      if (this == proto || window == this || this == null) {
        return p.inspectPlugin(proto);
      }
      // called normally
      object = Object(this);
      length = object.length >>> 0;
      result = [];

      while (length--) {
        result[length] = origin.Object.inspect(object[length]);
      }
      return origin.String('[' + result.join(', ') + ']');
    }

    (fuse.Array.plugin.inspect = inspect)[ORIGIN] = fuse;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function inspect(useDoubleQuotes) {
      var string = this, p = fuse._, origin = inspect[ORIGIN],
       String = origin.String, strProto = String.prototype;

      // called by Obj.inspect on fuse.String or its plugin object
      if (string == strProto || window == string || string == null) {
        return p.inspectPlugin(strProto);
      }
      // called normally
      return String(useDoubleQuotes
        ? '"' + p.strReplace.call(string, p.reWithDoubleQuotes, p.escapeSpecialChars) + '"'
        : "'" + p.strReplace.call(string, p.reWithSingleQuotes, p.escapeSpecialChars) + "'");
    }

    (fuse.String.plugin.inspect = inspect)[ORIGIN] = fuse;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function inspect(value) {
      var classOf, object, result = [],
       origin = inspect[ORIGIN], Object = origin.Object,
       String = origin.String, strInspect = String.prototype.inspect;

      if (value != null) {
        // this is not duplicating checks, one is a type check for host objects
        // and the other is an internal [[Class]] check because Safari 3.1
        // mistakes regexp instances as typeof `function`
        object = Object(value);
        if (typeof object.inspect == 'function' &&
            Object.isFunction(object.inspect)) {
          return object.inspect();
        }
        // attempt to avoid inspecting DOM nodes.
        // IE treats nodes like objects:
        // IE7 and below are missing the node's constructor property
        // IE8 node constructors are typeof "object"
        try {
          classOf = Object.prototype.toString.call(object);
          if (classOf == '[object Object]' && typeof object.constructor == 'function') {
            Object.each(object, function(value, key) {
              result.push(strInspect.call(key) + ': ' + fuse.Object.inspect(object[key]));
            });
            return String('{' + result.join(', ') + '}');
          }
        } catch (e) { }
      }
      // try coercing to string
      try {
        return String(value);
      } catch (e) {
        // probably caused by having the `toString` of an object call inspect()
        if (e.constructor == window.RangeError) {
          return String('...');
        }
        throw e;
      }
    }

    (fuse.Object.inspect = inspect)[ORIGIN] = fuse;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function inspect() {
      return fuse.Object.isFunction(this._each)
        ? inspect[ORIGIN].String('#<Enumerable:' + this.toArray().inspect() + '>')
        : fuse._.inspectPlugin(fuse.Class.mixins.enumerable);
    }

    var mixin = fuse.Class.mixins.enumerable;
    if (mixin) {
      (mixin.inspect = inspect)[ORIGIN] = fuse;
    }
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function inspect() {
      var pair, i = -1, p = fuse._, origin = inspect[ORIGIN],
       hashPlugin = origin.Hash.plugin, pairs = this._pairs, result = [];

      // called by Obj.inspect() on fuse.Hash or its plugin object
      if (this == hashPlugin || window == this || this == null) {
        result = p.inspectPlugin(hashPlugin);
      }
      else {
        // called normally
        while (pair = pairs[++i]) {
          result[i] = pair[0].inspect() + ': ' + origin.Object.inspect(pair[1]);
        }
        result = '#<Hash:{' + result.join(', ') + '}>';
      }
      return origin.String(result);
    }

    if (fuse.Hash) {
      (fuse.Hash.plugin.inspect = inspect)[ORIGIN] = fuse;
    }
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function inspect() {
      var className, element, id, result,
       p = fuse._, origin = inspect[ORIGIN],
       strInspect = origin.String.prototype.inspect,
       elemProto = (origin.dom ? origin.dom.HTMLElement : origin.HTMLElement).prototype;

      // called by Obj.inspect() on a fuse Element class or its plugin object
      if (this == elemProto || window == this || this == null) {
        result = p.inspectPlugin(elemProto);
      }
      else {
        // called normally
        element = this.raw || this;
        result = '<' + element.nodeName.toLowerCase();
        if (id = element.id) {
          result += ' id=' + strInspect.call(id, true);
        }
        if (className = element.className) {
          result += ' class=' + strInspect.call(className, true);
        }
        result += '>';
      }
      return origin.String(result);
    }

    if (fuse.dom) {
      (fuse.dom.HTMLElement.plugin.inspect = inspect)[ORIGIN] = fuse;
    }
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    var ORIGIN = '__origin__';

    function inspect() {
      var origin = inspect[ORIGIN],
       eventProto = (origin.dom ? origin.dom.Event : origin.Event).prototype;
      return origin.String(this == eventProto
        ? fuse._.inspectPlugin(eventProto)
        : '[object Event]');
    }

    if (fuse.dom && fuse.dom.Event) {
      (fuse.dom.Event.plugin.inspect = inspect)[ORIGIN] = fuse;
    }
  })();

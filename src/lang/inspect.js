  /*----------------------------- LANG: INSPECT ------------------------------*/

  (function() {
    var elemPlugin, eventPlugin, hashPlugin, strInspect,

    SPECIAL_CHARS = {
      '\b': '\\b',
      '\f': '\\f',
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\\': '\\\\',
      '"' : '\\"',
      "'" : "\\'"
    },

    // charCodes 0-31 and \ and '
    reWithSingleQuotes = /[\x00-\x1f\\']/g,

    // charCodes 0-31 and \ and "
    reWithDoubleQuotes = /[\x00-\x1f\\"]/g,

    arrPlugin = fuse.Array.plugin,

    nlPlugin  = NodeList && NodeList.plugin || arrPlugin,

    strPlugin = fuse.String.plugin,

    escapeSpecialChars = function(match) {
      return SPECIAL_CHARS[match];
    },

    inspectPlugin = function(plugin) {
      var result, backup = plugin.inspect;
      plugin.inspect = uid;
      result = fuse.Object.inspect(plugin).replace(uid, String(backup));
      plugin.inspect = backup;
      return result;
    };

    // populate SPECIAL_CHARS with control characters
    (function(i, key) {
      while (--i) {
        key = String.fromCharCode(i);
        SPECIAL_CHARS[key] || (SPECIAL_CHARS[key] = '\\u' + ('0000' + i.toString(16)).slice(-4));
      }
    })(32);

    /*------------------------------------------------------------------------*/

    strInspect =
    strPlugin.inspect = function inspect(useDoubleQuotes) {
      // called by Obj.inspect on fuse.String or its plugin object
      if (this == strPlugin || window == this || this == null) {
        return inspectPlugin(strPlugin);
      }
      // called normally
      var string = String(this);
      return fuse.String(useDoubleQuotes
        ? '"' + string.replace(reWithDoubleQuotes, escapeSpecialChars) + '"'
        : "'" + string.replace(reWithSingleQuotes, escapeSpecialChars) + "'");
    };

    arrPlugin.inspect = function inspect() {
      // called by Obj.inspect on fuse.Array/fuse.dom.NodeList or its plugin object
      var length, object, result, plugin = this == nlPlugin ? nlPlugin : arrPlugin;
      if (this == plugin || window == this || this == null) {
        return inspectPlugin(plugin);
      }
      // called normally
      object = Object(this);
      length = object.length >>> 0;
      result = [];

      while (length--) {
        result[length] = fuse.Object.inspect(object[length]);
      }
      return fuse.String('[' + result.join(', ') + ']');
    };

    fuse.Object.inspect = function inspect(value) {
      var classOf, object, result;
      if (value != null) {
        object = fuse.Object(value);

        // this is not duplicating checks, one is a type check for host objects
        // and the other is an internal [[Class]] check because Safari 3.1
        // mistakes regexp instances as typeof `function`
        if (typeof object.inspect == 'function' &&
            isFunction(object.inspect)) {
          return object.inspect();
        }
        // attempt to avoid inspecting DOM nodes.
        // IE treats nodes like objects:
        // IE7 and below are missing the node's constructor property
        // IE8 node constructors are typeof "object"
        try {
          classOf = toString.call(object);
          if (classOf == '[object Object]' && typeof object.constructor == 'function') {
            result = [];
            eachKey(object, function(value, key) {
              hasKey(object, key) &&
                result.push(strInspect.call(key) + ': ' + fuse.Object.inspect(object[key]));
            });
            return fuse.String('{' + result.join(', ') + '}');
          }
        } catch (e) { }
      }
      // try coercing to string
      try {
        return fuse.String(value);
      } catch (e) {
        // probably caused by having the `toString` of an object call inspect()
        if (e.constructor == window.RangeError) {
          return fuse.String('...');
        }
        throw e;
      }
    };

    if (fuse.Class.mixins.enumerable) {
      fuse.Class.mixins.enumerable.inspect = function inspect() {
        return isFunction(this._each)
          ? fuse.String('#<Enumerable:' + this.toArray().inspect() + '>')
          : inspectPlugin(fuse.Class.mixins.enumerable);
      };
    }

    if (fuse.Hash) {
      hashPlugin = fuse.Hash.plugin;
      hashPlugin.inspect = function inspect() {
        // called by Obj.inspect() on fuse.Hash or its plugin object
        if (this == hashPlugin || window == this || this == null) {
          return inspectPlugin(hashPlugin);
        }
        // called normally
        var pair, i = -1, pairs = this._pairs, result = [];
        while (pair = pairs[++i]) {
          result[i] = pair[0].inspect() + ': ' + fuse.Object.inspect(pair[1]);
        }
        return '#<Hash:{' + result.join(', ') + '}>';
      };
    }

    if (fuse.dom) {
      elemPlugin = HTMLElement.plugin;
      elemPlugin.inspect = function inspect() {
        // called by Obj.inspect() on a fuse Element class or its plugin object
        if (this == elemPlugin || window == this || this == null) {
          return inspectPlugin(this);
        }
        // called normally
        var element = this.raw || this,
         id         = element.id,
         className  = element.className,
         result     = '<' + element.nodeName.toLowerCase();

        if (id) {
          result += ' id=' + strInspect.call(id, true);
        }
        if (className) {
          result += ' class=' + strInspect.call(className, true);
        }
        return fuse.String(result + '>');
      };
    }

    if (fuse.dom.Event) {
      eventPlugin = fuse.dom.Event.plugin;
      eventPlugin.inspect = function inspect() {
        return this == eventPlugin
          ? inspectPlugin(eventPlugin)
          : '[object Event]';
      };
    }

    // prevent JScript bug with named function expressions
    var inspect = null;
  })();

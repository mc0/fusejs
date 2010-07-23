  /*----------------------------- LANG: INSPECT ------------------------------*/

  (function() {
    var strInspect,

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
      // called Obj.inspect(fuse.String.plugin) or Obj.inspect(fuse.Array)
      if (this == strPlugin || window == this || this == null) {
        return inspectPlugin(strPlugin);
      }
      // called normally fuse.String(...).inspect()
      var string = String(this);
      return fuse.String(useDoubleQuotes
        ? '"' + string.replace(reWithDoubleQuotes, escapeSpecialChars) + '"'
        : "'" + string.replace(reWithSingleQuotes, escapeSpecialChars) + "'");
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

    addArrayMethods.callbacks.push(function(List) {
      var plugin = List.plugin;
      plugin.inspect = function inspect() {
        // called Obj.inspect(fuse.Array.plugin) or Obj.inspect(fuse.Array)
        if (this == plugin || window == this || this == null) {
          return inspectPlugin(plugin);
        }
        // called normally fuse.Array(...).inspect()
        var result = [], object = Object(this), length = object.length >>> 0;
        while (length--) {
          result[length] = fuse.Object.inspect(object[length]);
        }
        return fuse.String('[' + result.join(', ') + ']');
      };

      // prevent JScript bug with named function expressions
      var inspect = null;
    });

    if (fuse.Class.mixins.enumerable) {
      fuse.Class.mixins.enumerable.inspect = function inspect() {
        // called normally or called Obj.inspect(fuse.Class.mixins.enumerable)
        return isFunction(this._each)
          ? fuse.String('#<Enumerable:' + this.toArray().inspect() + '>')
          : inspectPlugin(fuse.Class.mixins.enumerable);
      };
    }

    if (fuse.Hash) {
      var hashPlugin = fuse.Hash.plugin;
      hashPlugin.inspect = function inspect() {
        // called Obj.inspect(fuse.Hash.plugin) or generic if added later
        if (this == hashPlugin || window == this || this == null) {
          return inspectPlugin(hashPlugin);
        }
        // called normally fuse.Hash(...).inspect()
        var pair, i = -1, pairs = this._pairs, result = [];
        while (pair = pairs[++i]) {
          result[i] = pair[0].inspect() + ': ' + fuse.Object.inspect(pair[1]);
        }
        return '#<Hash:{' + result.join(', ') + '}>';
      };
    }

    if (fuse.dom) {
      var elemPlugin = fuse.dom.Element.plugin;
      elemPlugin.inspect = function inspect() {
        // called Obj.inspect(Element.plugin) or Obj.inspect(Element)
        if (this == elemPlugin || window == this || this == null) {
          return inspectPlugin(this);
        }
        // called normally Element.inspect(element)
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
      var eventPlugin = fuse.dom.Event.plugin;
      eventPlugin.inspect = function inspect() {
        // called Obj.inspect(Event.plugin) or called normally event.inspect()
        return this == eventPlugin
          ? inspectPlugin(eventPlugin)
          : '[object Event]';
      };
    }

    // prevent JScript bug with named function expressions
    var inspect = null;
  })();

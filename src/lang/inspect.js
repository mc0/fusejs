  /*----------------------------- LANG: INSPECT ------------------------------*/

  (function() {
    var objInspect, strInspect,

    elemPlugin  = fuse.dom && fuse.dom.Element.plugin,

    eventPlugin = fuse.dom && fuse.dom.Event.plugin,

    hashPlugin  = fuse.Hash && fuse.Hash.plugin,

    strPlugin   = fuse.String.plugin,

    // charCodes 0-31 and \ and '
    reWithSingleQuotes = /[\x00-\x1f\\']/g,

    // charCodes 0-31 and \ and "
    reWithDoubleQuotes = /[\x00-\x1f\\"]/g,

    specialChars = {
      '\b': '\\b',
      '\f': '\\f',
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\\': '\\\\',
      '"' : '\\"',
      "'" : "\\'"
    },

    escapeSpecialChars = function(match) {
      return specialChars[match];
    },

    inspectPlugin = function(plugin) {
      var result, backup = plugin.inspect;
      plugin.inspect = expando;
      result = objInspect(plugin).replace(expando, String(backup));
      plugin.inspect = backup;
      return result;
    };

    // populate specialChars with control characters
    (function(i, key) {
      while (--i) {
        key = String.fromCharCode(i);
        if (!specialChars[key]) {
          specialChars[key] = '\\u' + ('0000' + i.toString(16)).slice(-4);
        }
      }
    })(32);

    /*------------------------------------------------------------------------*/

    addArrayMethods.callbacks.push(function(List) {
      var plugin = List.plugin;
      plugin.inspect = function inspect() {
        // called Obj.inspect(fuse.Array.plugin) or Obj.inspect(fuse.Array)
        if (this === plugin || this == global || this == null) {
          return inspectPlugin(plugin);
        }
        // called normally fuse.Array(...).inspect()
        var results = [], object = Object(this), length = object.length >>> 0;
        while (length--) {
          results[length] = objInspect(object[length]);
        }
        return fuse.String('[' + results.join(', ') + ']');
      };

      // prevent JScript bug with named function expressions
      var inspect = nil;
    });

    strInspect =
    strPlugin.inspect = function inspect(useDoubleQuotes) {
      // called Obj.inspect(fuse.String.plugin) or Obj.inspect(fuse.Array)
      if (this === strPlugin || this == global || this == null) {
        return inspectPlugin(strPlugin);
      }
      // called normally fuse.String(...).inspect()
      var string = String(this);
      return fuse.String(useDoubleQuotes
        ? '"' + string.replace(reWithDoubleQuotes, escapeSpecialChars) + '"'
        : "'" + string.replace(reWithSingleQuotes, escapeSpecialChars) + "'");
    };

    if (Enumerable) {
      Enumerable.inspect = function inspect() {
        // called normally or called Obj.inspect(fuse.Enumerable)
        return isFunction(this._each)
          ? fuse.String('#<Enumerable:' + this.toArray().inspect() + '>')
          : inspectPlugin(fuse.Enumerable);
      };
    }

    if (hashPlugin) {
      hashPlugin.inspect = function inspect() {
        // called Obj.inspect(fuse.Hash.plugin) or generic if added later
        if (this === hashPlugin || this == global || this == null) {
          return inspectPlugin(hashPlugin);
        }
        // called normally fuse.Hash(...).inspect()
        var pair, i = -1, pairs = this._pairs, result = [];
        while (pair = pairs[++i]) {
          result[i] = pair[0].inspect() + ': ' + objInspect(pair[1]);
        }
        return '#<Hash:{' + result.join(', ') + '}>';
      };
    }

    if (elemPlugin) {
      elemPlugin.inspect = function inspect() {
        // called Obj.inspect(Element.plugin) or Obj.inspect(Element)
        if (this === elemPlugin || this == global || this == null) {
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

    if (eventPlugin) {
      eventPlugin.inspect = function inspect() {
        // called Obj.inspect(Event.plugin) or called normally event.inspect()
        return this === eventPlugin
          ? inspectPlugin(eventPlugin)
          : '[object Event]';
      };
    }

    // used by the framework closure
    inspect =

    // used by this closure only
    objInspect =

    Obj.inspect = function inspect(value) {
      var classType, object, results;
      if (value != null) {
        object = fuse.Object(value);

        // this is not duplicating checks, one is a type check the other
        // is an internal [[Class]] check because Safari 3.1 mistakes
        // regexp instances as typeof `function`
        if (typeof object.inspect === 'function' &&
            isFunction(object.inspect)) {
          return object.inspect();
        }

        // attempt to avoid inspecting DOM nodes.
        // IE treats nodes like objects:
        // IE7 and below are missing the node's constructor property
        // IE8 node constructors are typeof "object"
        try {
          classType = toString.call(object);
          if (classType === '[object Object]' && typeof object.constructor === 'function') {
            results = [];
            eachKey(object, function(value, key) {
              hasKey(object, key) &&
                results.push(strInspect.call(key) + ': ' + objInspect(object[key]));
            });
            return fuse.String('{' + results.join(', ') + '}');
          }
        } catch (e) { }
      }

      // try coercing to string
      try {
        return fuse.String(value);
      } catch (e) {
        // probably caused by having the `toString` of an object call inspect()
        if (e.constructor === global.RangeError) {
          return fuse.String('...');
        }
        throw e;
      }
    };
  })();

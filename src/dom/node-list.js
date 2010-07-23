  /*----------------------------- DOM: NODELIST ------------------------------*/

  NodeList =
  fuse.dom.NodeList = fuse.Fusebox().Array;

  addNodeListMethod = (function(plugin) {

    var SKIPPED_KEYS = { 'callSuper': 1, 'constructor': 1, 'match': 1, 'query': 1 },
     domClassCache = { },
     arrPlugin = fuse.Array.plugin,
     arrEvery  = arrPlugin.every,
     arrEach   = arrPlugin.forEach,
     arrSome   = arrPlugin.some,
     reBool    = /^(?:(?:is|has)[A-Z]|contains)/,
     reGetter  = /^(?:get[A-Z]|down|first|identify|inspect|last|next|previous|read|scroll)/;

    if (!arrEvery || arrEvery == (arrEvery = arrEvery.raw)) {
      arrEvery = function(callback) {
        var i = -1, array = this, length = array.length;
        while (++i < length) {
          if (i in array && !callback(array[i])) return false;
        }
        return true;
      };
    }
    if (!arrEach || arrEach == arrEach.raw) {
     arrEach = function(callback) {
        var i = -1, array = this, length = array.length;
        while (++i < length) {
          if (i in array) callback(array[i]);
        }
      };
    }
    if (!arrSome || arrSome == (arrSome = arrSome.raw)) {
      arrSome = function(callback) {
        var i = -1, array = this, length = array.length;
        while (++i < length) {
          if (i in array && callback(array[i])) return true;
        }
        return false;
      };
    }

    return function(value, key, object) {
      if (!SKIPPED_KEYS[key] && isFunction(value) && hasKey(object, key)) {
        if (reGetter.test(key)) {
          // getters return the value of the first element
          plugin[key] = Function('c,gc',
            'function ' + key + '(){' +
            'var m,n,e=this[0];' +
            'if(e){' +
            'm=(c[n=e.nodeName]||(c[n]=gc(n))).plugin.' + key + ';' +
            'return m&&(arguments.length?m.apply(e,arguments):m.call(e))' +
            '}}return ' + key)(domClassCache, getOrCreateTagClass);
        } else {
          // return true for methods prefixed with `is` when all return true OR
          // return true for methods prefixed with `has`/`contains` when some return true OR
          // return the array after executing a method for all elements
          var isBool = reBool.test(key);
          plugin[key] = Function('c,gc,am',
            'function ' + key + '(){' +
            'var a,es=this;' +
            (isBool ? 'return ' : '') +
            'am.call(es,arguments.length&&(a=arguments)' +
            '?function(e,m,n){return (m=(c[n=e.nodeName]||(c[n]=gc(n))).plugin.' + key + ')&&m.apply(e,a)}' +
            ':function(e,m,n){return (m=(c[n=e.nodeName]||(c[n]=gc(n))).plugin.' + key + ')&&m.call(e)})' +
            (isBool ? '' : ';return es') +
            '}return ' + key)(domClassCache, getOrCreateTagClass,
             isBool ? (key.indexOf('is') ? arrSome : arrEvery) : arrEach);
        }
      }
    };
  })(NodeList.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var elemPlugin = fuse.dom.Element.plugin,
     funcPlugin    = fuse.Function.plugin,
     funcApply     = funcPlugin.apply,
     funcCall      = funcPlugin.call;

    plugin.get = function get(index) {
      var result, object = Object(this), length = object.length >>> 0;
      if (index == null) {
        result = NodeList();
        for (index = 0; index < length; index++) {
          if (index in object) result[index] = Node(object[index]);
        }
        return result;
      }

      if (index < 0) {
        if ((index += length) < 0) index = 0;
      } else if (index > (length && --length)) {
        index = length;
      }
      return Node(object[index]);
    };

    plugin.invoke = function invoke(method) {
      var args, item, i = 0, result = fuse.Array(),
       object = Object(this), length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object) {
            result[length] = funcCall
              .call(elemPlugin[method] || object[length][method], object[length]);
          }
        }
      } else {
        args = slice.call(arguments, 1);
        while (length--) {
          if (length in object) {
            result[length] = funcApply
              .call(elemPlugin[method] || object[length][method], object[length], args);
          }
        }
      }
      return result;
    }

    // prevent JScript bug with named function expressions
    var get = null, invoke = null;
  })(NodeList.plugin);

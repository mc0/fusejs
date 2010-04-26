  /*----------------------------- DOM: NODELIST ------------------------------*/

  NodeList =
  fuse.dom.NodeList = fuse.Fusebox().Array;

  (function(plugin) {
    var SKIPPED_KEYS = { 'callSuper': 1, 'constructor': 1, 'match': 1, 'select': 1 },

    domClassCache = { },

    arrProto  = Array.prototype,

    elemProto = Element.prototype,

    funcApply = Func.plugin.apply,

    funcCall  = Func.plugin.call,

    reBool    = /^(?:(?:is|has)[A-Z]|contains)/,

    reGetter  = /^(?:get[A-Z]|down|first|identify|inspect|last|next|previous|read|scroll)/,

    arrEvery = arrProto.every ||
      function(callback) {
        var i = -1, array = this, length = array.length;
        while (++i < length) {
          if (i in array && !callback(array[i]))
            return false;
        }
        return true;
      },

    arrEach = arrProto.forEach ||
      function(callback) {
        var i = -1, array = this, length = array.length;
        while (++i < length) {
          if (i in array) callback(array[i]);
        }
      },

    arrSome = arrProto.some ||
      function(callback) {
        var i = -1, array = this, length = array.length;
        while (++i < length) {
          if (i in array && callback(array[i]))
            return true;
        }
        return false;
      };

    // shared by primary closure
    addNodeListMethod = function(value, key, object) {
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
        }
        else {
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

    // add Element methods to fuse.dom.NodeList
    eachKey(Element.plugin, addNodeListMethod);

    if (fuse.dom.FormElement) {
      eachKey(fuse.dom.FormElement, addNodeListMethod);
    }
    if (fuse.dom.InputElement) {
      eachKey(fuse.dom.InputElement.plugin, addNodeListMethod);
    }

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
      var args, item, i = 0, result = fuse.Array(), object = Object(this),
       length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object) {
            result[length] = funcCall
              .call(elemProto[method] || object[length][method], object[length]);
          }
        }
      } else {
        args = slice.call(arguments, 1);
        while (length--) {
          if (length in object) {
            result[length] = funcApply
              .call(elemProto[method] || object[length][method], object[length], args);
          }
        }
      }
      return result;
    }

    // prevent JScript bug with named function expressions
    var get = nil, invoke = nil;
  })(NodeList.plugin);

  /*----------------------------- DOM: NODELIST ------------------------------*/

  NodeList =
  fuse.dom.NodeList = fuse.Fusebox().Array;

  (function(plugin) {
    var SKIPPED_KEYS = { 'callSuper': 1, 'constructor': 1, 'match': 1, 'select': 1 },

    arrProto = Array.prototype,

    arrEvery = arrProto.every ||
      function(callback) {
        var i = 0, array = this, l = array.length;
        for ( ; i < length; i++) {
          if (i in array && !callback(array[i]))
            return false;
        }
        return true;
      },

    arrEach = arrProto.forEach ||
      function(callback) {
        var i = 0, array = this, l = array.length;
        for ( ; i < length; i++) {
          if (i in array) callback(array[i]);
        }
      },

    arrSome = arrProto.some ||
      function(callback) {
        var i = 0, array = this, l = array.length;
        for ( ; i < length; i++) {
          if (i in array && callback(array[i]))
            return true;
        }
        return false;
      },

    reBool = /^(?:(?:is|has)[A-Z]|contains)/,

    reGetter = /^(?:get[A-Z]|down|first|identify|inspect|last|next|previous|read|scroll)/;

    function addMethod(value, key, object) {
      if (!SKIPPED_KEYS[key] && isFunction(value) && hasKey(object, key)) {
        if (reGetter.test(key)) {
          // getters return the value of the first element
          plugin[key] = Function('o',
            'function ' + key + '(){' +
            'var a=arguments,m=o.' + key + ',e=this[0];' +
            'if(e)return a.length?m.apply(e,a):m.call(e)' +
            '}return ' + key)(object);
        }
        else {
          // return true for methods prefixed with `is` when all return true OR
          // return true for methods prefixed with `has`/`contains` when some return true OR
          // return the array after executing a method for all elements
          var isBool = reBool.test(key);
          plugin[key] = Function('o,am',
            'function ' + key + '(){' +
            'var a=arguments,m=o.' + key + ',es=this;' +
            (isBool ? 'return ' : '') +
            'am.call(es,a.length' +
            '?function(e){return m.apply(e,a)}' +
            ':function(e){return m.call(e)})' +
            (isBool ? '' : ';return es') +
            '}return ' + key)(object,
             isBool ? (key.indexOf('is') ? arrSome : arrEvery) : arrEach);
        }
      }
    }

    // Add fuse.dom.Element methods to fuse.dom.NodeList
    eachKey(Element.plugin, addMethod);

    // Pave any fuse.dom.NodeList methods that fuse.Array shares.
    // You may call element first(), last(), and contains() by using invoke()
    // Ex: elements.invoke('first');
    addArrayMethods(NodeList);

  })(NodeList.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    plugin.get = function get(index) {
      var results, object = Object(this), length = object.length >>> 0;
      if (index == null) {
        results = NodeList();
        for (index = 0; index < length; index++) {
          if (index in object) results[index] = Node(object[index]);
        }
        return results;
      }

      if (index < 0) {
        if ((index += length) < 0) index = 0;
      } else if (index > --length) {
        index = length;
      }
      return Node(object[index]);
    };

    plugin.invoke = function invoke(method) {
      if (this == null) throw new TypeError;
      var args, item, i = 0, results = fuse.Array(), object = Object(this),
       length = object.length >>> 0, elemProto = Element.prototype,
       funcProto = Function.prototype;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object) {
            results[length] = funcProto.call
              .call(elemProto[method] || object[length][method], object[length]);
          }
        }
      } else {
        args = slice.call(arguments, 1);
        while (length--) {
          if (length in object) {
            results[length] = funcProto.apply
              .call(elemProto[method] || object[length][method], object[length], args);
          }
        }
      }
      return results;
    }

    // prevent JScript bug with named function expressions
    var get = nil, invoke = nil;
  })(NodeList.plugin);

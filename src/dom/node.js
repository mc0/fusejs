  /*------------------------------- DOM: NODE --------------------------------*/

  addNodeListMethods = (function() {
    var plugin,

    SKIPPED_KEYS = { 'callSuper': 1, 'constructor': 1, 'match': 1, 'select': 1 },

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
            (isBool ? 'return ' : '') + 'a.length' +
            '?am.apply(es,function(e){return m.apply(e,a)})' +
            ':am.call(es,function(e){return m.call(e)})' +
            (isBool ? '' : ';return es') +
            '}return ' + key)(object,
             isBool ? (key.indexOf('is') ? arrSome : arrEvery) : arrEach);
        }
      }
    }

    return function(List) {
      plugin = List.plugin;
      eachKey(Element.plugin, addMethod);
    };
  })();

  /*--------------------------------------------------------------------------*/

  Node =
  fuse.dom.Node = (function() {
    function Decorator() { }

    function Node(node) {
      // return if falsy or already decoratored
      if (!node || node.raw) return node;

      var data, decorated, id, ownerDoc;
      if (node.nodeType !== TEXT_NODE) {

        // switch flag to bail early for window objects
        retWindowId = false;
        id = getFuseId.call(node);
        retWindowId = true;

        // return if window
        if (!id) return node;

        // return cached if available
        if ((data = Data[id]).decorator) return data.decorator;

        // pass to element decorator
        switch (node.nodeType) {
          case ELEMENT_NODE:  return fromElement(node);
          case DOCUMENT_NODE: return Document(node);
        }
      }

      decorated = new Decorator;
      decorated.raw = node;
      decorated.nodeName = node.nodeName;

      if (data) {
        data.node = node;
        data.decorator = decorated;
      }

      return decorated;
    }

    function createIdGetter() {
      function getFuseId() {
        // if cache doesn't match, request a new id
        var c = Data[id];
        if (c.node && c.node !== this)
          return (this.getFuseId = createIdGetter())();
        return id;
      }
      // private id variable
      var id = String(fuseId);
      Data[fuseId++] = { };
      return getFuseId;
    }

    function getFuseId() {
      // keep a loose match because frame object !== document.parentWindow
      var id = false,
       node  = this.raw || this,
       win   = getWindow(node);

      if (node.getFuseId) {
        return node.getFuseId();
      }
      else if (node == win) {
        if (retWindowId) {
          id = '1';
          if (node != global) {
            id = getFuseId(win.frameElement) + '-1';
            Data[id] || (Data[id] = { });
          }
        }
        return id;
      }
      else if (node.nodeType === DOCUMENT_NODE) {
        if (node === fuse._doc) return '2';
        id = getFuseId(win.frameElement) + '-2';
        Data[id] || (Data[id] = { 'nodes': { } });
        return id;
      }
      return (node.getFuseId = createIdGetter())();
    }

    var fuseId = 3, retWindowId = true,
     Node = Class({ 'constructor': Node });

    Decorator.prototype = Node.plugin;
    Node.plugin.getFuseId = getFuseId;
    return Node;
  })();

  /*--------------------------------------------------------------------------*/

  Node.getFuseId = (function(__getFuseId) {
    function getFuseId(node) {
      return __getFuseId.call(node);
    }
    return getFuseId;
  })(Node.plugin.getFuseId);

  Node.updateGenerics = (function() {
    var SKIPPED_KEYS = { 'constructor': 1, 'getFuseId': 1 };

    function createGeneric(proto, methodName) {
      return new Function('proto, slice',
        'function ' + methodName + '(node) {' +
        'node = fuse.get(node);' +
        'var args = arguments;' +
        'return args.length ? proto.' + methodName +
        '.apply(node, slice.call(args, 1)) : ' +
        'proto.' + methodName + '.call(node); }' +
        'return ' + methodName)(proto, slice);
    }

    function updateGenerics(deep) {
      var Klass = this;
      if (deep) {
        fuse.updateGenerics(Klass, deep);
      } else {
        Obj._each(Klass.prototype, function(value, key, proto) {
          if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
            Klass[key] = createGeneric(proto, key);
        });
      }
    }

    return updateGenerics;
  })();

  // constants
  Node.DOCUMENT_FRAGMENT_NODE =      DOCUMENT_FRAGMENT_NODE;
  Node.DOCUMENT_NODE =               DOCUMENT_NODE;
  Node.ELEMENT_NODE =                ELEMENT_NODE;
  Node.TEXT_NODE =                   TEXT_NODE;
  Node.ATTRIBUTE_NODE =              2;
  Node.CDATA_SECTION_NODE =          4;
  Node.ENTITY_REFERENCE_NODE =       5;
  Node.ENTITY_NODE =                 6;
  Node.PROCESSING_INSTRUCTION_NODE = 7;
  Node.COMMENT_NODE =                8;
  Node.DOCUMENT_TYPE_NODE =          10;
  Node.NOTATION_NODE =               12;

  Node.updateGenerics();

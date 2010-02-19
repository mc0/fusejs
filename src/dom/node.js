  /*------------------------------- DOM: NODE --------------------------------*/

  Node =
  fuse.dom.Node = (function() {

    var fuseId = 3,

    retWinId = true,

    uid = envTest('ELEMENT_UNIQUE_NUMBER') ? 'uniqueNumber' : '_fuseId',

    Decorator = function() { },

    Node = function Node(node) {
      // quick return if falsy or decorated
      var data, decorated, id, ownerDoc;
      if (!node || node.raw) {
        return node;
      }
      if (node.nodeType !== TEXT_NODE) {
        // switch flag to bail early for window objects
        retWinId = false;
        id = getFuseId.call(node);
        retWinId = true;

        // return if window
        if (!id) {
          return node;
        }
        // return cached if available
        if ((data = Data[id]).decorator) {
          return data.decorator;
        }
        // pass to element decorator
        switch (node.nodeType) {
          case ELEMENT_NODE:  return fromElement(node);
          case DOCUMENT_NODE: return Document(node);
        }
      }

      // use new Decorator, which has Node.plugin mapped to Decorator.prototype,
      // to avoid `new` operator with fuse.dom.Node
      decorated = new Decorator;
      decorated.raw = node;
      decorated.nodeName = node.nodeName;

      // text node decorators are not cached
      return data
        ? (data.decorator = decorated)
        : decorated;
    },

    getFuseId = function getFuseId() {
      var win, node = this.raw || this, id = node[uid];

      // quick return for nodes with ids
      // IE can avoid adding an expando on each node and use the `uniqueNumber` property instead.
      if (id) {
        Data[id] || (Data[id] = { });
        return id;
      }

      // In IE window == document is true but not document == window.
      // Use loose comparison because different `window` references for
      // the same window may not strict equal each other.
      win = getWindow(node);
      if (node == win) {
        // optimization flag is set in the Node factory to avoid
        // resolving ids for windows when not needed
        if (retWinId) {
          id = '1';
          if (node != global) {
            id = getFuseId(win.frameElement) + '-1';
            Data[id] || (Data[id] = { });
          }
        } else {
          id = false;
        }
        return id;
      }
      else if (node.nodeType === DOCUMENT_NODE) {
        // quick return for common case
        if (node === fuse._doc) return '2';
        // calculate id for foreign document objects
        id = getFuseId(win.frameElement) + '-2';
        Data[id] || (Data[id] = { 'nodes': { } });
        return id;
      }

      id = node._fuseId = fuseId++;
      Data[id] = { };
      return id;
    };

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
    var SKIPPED_KEYS = { 'constructor': 1, 'callSuper': 1, 'getFuseId': 1 };

    function createGeneric(proto, methodName) {
      return Function('o,s',
        'function ' + methodName + '(node){' +
        'var a=arguments,n=fuse.get(node),m=o.' + methodName +
        ';return a.length' +
        '?m.apply(n,s.call(a,1))' +
        ':m.call(n)' +
        '}return ' + methodName)(proto, slice);
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

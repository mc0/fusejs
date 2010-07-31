  /*------------------------------- DOM: NODE --------------------------------*/

  DATA_ID_PROP = envTest('ELEMENT_UNIQUE_NUMBER') ? 'uniqueNumber' : '_fuseId';

  Node =
  fuse.dom.Node = (function() {

    var Decorator = function() { },

    Node = function Node(node, isCached) {
      // quick return if falsy or decorated
      var data, decorated;
      if (!node || node.raw) {
        return node;
      }
      if (node.nodeType != TEXT_NODE) {
        // return cached if available
        if (isCached !== false) {
          data = domData[Node.getFuseId(node)];
          if (data.decorator) {
            return data.decorator;
          }
        }
        // pass to element decorator
        switch (node.nodeType) {
          case ELEMENT_NODE:  return fromElement(node, isCached);
          case DOCUMENT_NODE: return Document(node, isCached);
        }
      }

      decorated = new Decorator;
      decorated.raw = node;
      decorated.nodeName = node.nodeName;

      // text node decorators are not cached
      return data ? (data.decorator = decorated) : decorated;
    },

    getFuseId = function getFuseId(skipDataInit) {
      return Node.getFuseId(this, skipDataInit);
    };

    fuse.Class({ 'constructor': Node, 'getFuseId': getFuseId });
    Decorator.prototype = Node.plugin;
    return Node;
  })();

  /*--------------------------------------------------------------------------*/

  Node.addStatics(function() {

    var SKIPPED_KEYS = { 'constructor': 1, 'callSuper': 1, 'getFuseId': 1 },

    fuseId = 3,

    createGeneric = function(proto, methodName) {
      return Function('o,s',
        'function ' + methodName + '(node){' +
        'var a=arguments,n=fuse(node),m=o.' + methodName +
        ';return a.length' +
        '?m.apply(n,s.call(a,1))' +
        ':m.call(n)' +
        '}return ' + methodName)(proto, slice);
    },

    updateGenerics = function updateGenerics(deep) {
      var Klass = this;
      if (deep) {
        fuse.updateGenerics(Klass, deep);
      } else {
        fuse.Object.each(Klass.prototype, function(value, key, proto) {
          if (!SKIPPED_KEYS[key] && hasKey(proto, key) && isFunction(proto[key]))
            Klass[key] = createGeneric(proto, key);
        });
      }
    },

    getFuseId = function getFuseId(node, skipDataInit) {
      node = node.raw || node;
      var win, id = node[DATA_ID_PROP];

      // quick return for nodes with ids
      // IE can avoid adding an expando on each node and use the `uniqueNumber` property instead.
      if (!id) {
        // In IE window == document is true but not document == window.
        // Use loose comparison because different `window` references for
        // the same window may not strict equal each other.
        win = getWindow(node);
        if (node == win) {
          id = node == window ? '1' : getFuseId(node.frameElement) + '-1';
        }
        else if (node.nodeType == DOCUMENT_NODE) {
          // quick return for common case OR
          // calculate id for foreign document objects
          id = node == fuse._doc ? '2' : getFuseId(win.frameElement) + '-2';
          skipDataInit || (skipDataInit = domData[id]);
          if (!skipDataInit) {
            skipDataInit =
            domData[id] = { 'nodes': { } };
          }
        }
        else {
          id = node._fuseId = fuseId++;
        }
      }
      skipDataInit || (skipDataInit = domData[id]);
      if (!skipDataInit) {
        domData[id] = { };
      }
      return id;
    };

    return {
      'DOCUMENT_FRAGMENT_NODE':      DOCUMENT_FRAGMENT_NODE,
      'DOCUMENT_NODE':               DOCUMENT_NODE,
      'ELEMENT_NODE':                ELEMENT_NODE,
      'TEXT_NODE':                   TEXT_NODE,
      'ATTRIBUTE_NODE':              2,
      'CDATA_SECTION_NODE':          4,
      'ENTITY_REFERENCE_NODE':       5,
      'ENTITY_NODE':                 6,
      'PROCESSING_INSTRUCTION_NODE': 7,
      'COMMENT_NODE':                8,
      'DOCUMENT_TYPE_NODE':          10,
      'NOTATION_NODE':               12,
      'getFuseId':      getFuseId,
      'updateGenerics': updateGenerics
    };
  });

  // define private var shared by primary closure
  getFuseId = Node.getFuseId;

  Node.updateGenerics();

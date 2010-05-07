  /*------------------------------- DOM: NODE --------------------------------*/

  DATA_ID_PROP = envTest('ELEMENT_UNIQUE_NUMBER') ? 'uniqueNumber' : '_fuseId';

  Node =
  fuse.dom.Node = (function() {

    var Decorator = function() { },

    Node = function Node(node) {
      // quick return if falsy or decorated
      var data, decorated, id;
      if (!node || node.raw) {
        return node;
      }
      if (node.nodeType !== TEXT_NODE) {
        // return cached if available
        id = Node.getFuseId(node);
        if ((data = domData[id]).decorator) {
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
      return Node.getFuseId(this);
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
          if (!SKIPPED_KEYS[key] && isFunction(proto[key]) && hasKey(proto, key))
            Klass[key] = createGeneric(proto, key);
        });
      }
    },

    getFuseId = function getFuseId(node) {
      node = node.raw || node;
      var win, id = node[DATA_ID_PROP];

      // quick return for nodes with ids
      // IE can avoid adding an expando on each node and use the `uniqueNumber` property instead.
      if (id) {
        domData[id] || (domData[id] = { });
        return id;
      }
      // In IE window == document is true but not document == window.
      // Use loose comparison because different `window` references for
      // the same window may not strict equal each other.
      win = getWindow(node);
      if (node == win) {
        // optimization flag is set in the Node factory to avoid
        // resolving ids for windows when not needed
        id = '1';
        if (node != global) {
          id = getFuseId(node.frameElement) + '-1';
          domData[id] || (domData[id] = { });
        }
        return id;
      }
      else if (node.nodeType === DOCUMENT_NODE) {
        // quick return for common case
        if (node === fuse._doc) return '2';
        // calculate id for foreign document objects
        id = getFuseId(win.frameElement) + '-2';
        domData[id] || (domData[id] = { 'nodes': { } });
        return id;
      }

      id = node._fuseId = fuseId++;
      domData[id] = { };
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

  Node.updateGenerics();

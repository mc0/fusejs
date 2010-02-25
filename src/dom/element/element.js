  /*-------------------------------- ELEMENT ---------------------------------*/

  Element =
  fuse.dom.Element = Class(Node, function() {
    function Element(tagName, attributes, context) {
      return isString(tagName)
        ? Element.create(tagName, attributes, context)
        : fromElement(tagName);
    }

    return { 'constructor': Element };
  });

  Element.updateGenerics = Node.updateGenerics;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var idCounter = 0;

    plugin.identify = function identify() {
      // use getAttribute to avoid issues with form elements and
      // child controls with ids/names of "id"
      var element = this.raw || this,
       id = plugin.getAttribute.call(this, 'id');
      if (id.length) return id;

      var ownerDoc = element.ownerDocument;
      do { id = 'anonymous_element_' + idCounter++; }
      while (ownerDoc.getElementById(id));

      plugin.setAttribute.call(this, 'id', id);
      return fuse.String(id);
    };

    plugin.isEmpty = function isEmpty() {
      return fuse.String((this.raw || this).innerHTML).blank();
    };

    plugin.isDetached = (function() {
      var isDetached = function isDetached() {
        var element = this.raw || this;
        return !(element.parentNode &&
          plugin.contains.call(element.ownerDocument, element));
      };

      if (envTest('ELEMENT_SOURCE_INDEX', 'DOCUMENT_ALL_COLLECTION')) {
        isDetached = function isDetached() {
          var element = this.raw || this;
          return element.ownerDocument.all[element.sourceIndex] !== element;
        };
      }
      if (envTest('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
        isDetached = function isDetached() {
          /* DOCUMENT_POSITION_DISCONNECTED = 0x01 */
          var element = this.raw || this;
          return (element.ownerDocument.compareDocumentPosition(element) & 1) === 1;
        };
      }
      return isDetached;
    })();

    // prevent JScript bug with named function expressions
    var identify = nil, isDetached = nil, isEmpty = nil;
  })(Element.plugin);

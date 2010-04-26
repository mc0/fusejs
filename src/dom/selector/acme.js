  /*----------------------------- SELECTOR: ACME -----------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      element = element.raw || fuse.get(element).raw;
      var node, i = -1, result = acme.query(String(selectors || ''),
        fuse.getDocument(element));

      while (node = result[++i]) {
        if (node === element) return true;
      }
      return false;
    },

    query = function(selectors, context, callback, toList) {
      var node, i = -1, result = toList(acme.query(String(selectors || ''),
        context && fuse.get(context).raw || fuse._doc));
      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return result;
    },

    select = function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList.fromNodeList);
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);

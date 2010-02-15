  /*----------------------------- SELECTOR: ACME -----------------------------*/

  (function(object, NodeList) {
    function match(element, selectors) {
      element = element.raw || fuse.get(element).raw;
      var node, i = -1, results = acme.query(String(selectors || ''),
        fuse.getDocument(element));

      while (node = results[++i]) {
        if (node === element) return true;
      }
      return false;
    }

    function query(selectors, context, callback, toList) {
      var node, i = -1, results = toList(acme.query(String(selectors || ''),
        context && fuse.get(context).raw || fuse._doc));
      if (callback) {
        while (node = results[++i]) callback(node);
      }
      return results;
    }

    function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList.fromNodeList);
    }

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);

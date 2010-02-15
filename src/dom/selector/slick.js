  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  (function(object, NodeList) {
    function match(element, selectors) {
      element = element.raw || fuse.get(element).raw;
      var node, i = -1, results = Slick(fuse.getDocument(element),
        String(selectors || ''));

      while (node = results[++i]) {
        if (node === element) return true;
      }
      return false;
    }

    function query(selectors, context, callback, List) {
      var node, i = -1, results = Slick(context && fuse.get(context).raw || fuse._doc,
        String(selectors || ''), List);
      if (callback) {
        while (node = results[++i]) callback(node);
      }
      return results;
    }

    function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList());
    }

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);

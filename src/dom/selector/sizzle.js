  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  (function(object, NodeList) {
    function match(element, selectors) {
      return Sizzle(String(selectors || ''), null, null,
        [element.raw || fuse.get(element).raw]).length === 1;
    }

    function query(selectors, context, callback, List) {
      var node, i = -1, results = Sizzle(String(selectors || ''),
        context && fuse.get(context).raw || fuse._doc, List);
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

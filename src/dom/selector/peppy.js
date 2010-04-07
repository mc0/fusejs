  /*---------------------------- SELECTOR: PEPPY -----------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      element = element.raw || fuse.get(element).raw;
      var node, i = -1, results = peppy.query(String(selectors || ''),
        fuse.getDocument(element));

      while (node = results[++i]) {
        if (node === element) return true;
      }
      return false;
    },

    query = function(selectors, context, callback, toList) {
      var node, i = -1, results = toList(peppy.query(String(selectors || ''),
        context && fuse.get(context).raw || fuse._doc));
      if (callback) {
        while (node = results[++i]) callback(node);
      }
      return results;
    },

    select = function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList.fromNodeList);
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);

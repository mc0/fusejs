  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      return Sizzle(String(selectors || ''), null, null,
        [element.raw || fuse.get(element).raw]).length === 1;
    },

    query = function(selectors, context, callback, List) {
      var node, i = -1, results = Sizzle(String(selectors || ''),
        context && fuse.get(context).raw || fuse._doc, List);
      if (callback) {
        while (node = results[++i]) callback(node);
      }
      return results;
    },

    select = function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList());
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);

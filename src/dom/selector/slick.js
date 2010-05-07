  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      return Slick.match(element.raw || fuse(element).raw,
        String(selectors || ''));
    },

    query = function(selectors, context, callback, List) {
      var node, i = -1, result = Slick.search(context && fuse(context).raw || fuse._doc,
        String(selectors || ''), List);
      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return result;
    },

    select = function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList());
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);

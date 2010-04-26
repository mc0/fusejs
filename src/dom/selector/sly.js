  /*----------------------------- SELECTOR: SLY ------------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      return Sly(String(selectors || ''))
        .match(element.raw || fuse.get(element).raw);
    },

    query = function(selectors, context, callback, toList) {
      var node, i = -1, result = toList(Sly(String(selectors || ''),
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

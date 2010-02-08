  /*---------------------------- SELECTOR: PEPPY -----------------------------*/

  (function(object, NodeList, RawList) {
    function match(element, selectors) {
      element = element.raw || fuse.get(element).raw;
      var node, i = -1, results = peppy.query(String(selectors || ''),
        fuse.getDocument(element));

      while (node = results[++i]) {
        if (node === element) return true;
      }
      return false;
    }

    function query(selectors, context, callback, toList) {
      var node, i = -1, results = toList(peppy.query(String(selectors || ''),
        context && fuse.get(context).raw || fuse._doc));
      if (callback) {
        while (node = results[++i]) callback(node);
      }
      return results;
    }

    function rawSelect(selectors, context, callback) {
      return query(selectors, context, callback, RawList.fromNodeList);
    }

    function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList.fromNodeList);
    }

    object.match = match;
    object.rawSelect = rawSelect;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList, fuse.dom.RawList);

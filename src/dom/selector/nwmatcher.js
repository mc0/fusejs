  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(object, Node, NodeList, RawList) {
    function match(element, selectors, context) {
      function match(element, selectors, context) {
        return __match(
          element.raw || fuse.get(element).raw,
          String(selectors || ''),
          context && fuse.get(context).raw);
      }

      __match = NW.Dom.match;
      return (object.match = match)(element, selectors, context);
    }

    function rawSelect(selectors, context, callback) {
      function rawSelect(selectors, context, callback) {
        var i = -1, results = RawList();
        __select(
          String(selectors || ''),
          context && fuse.get(context).raw,
          function(node) {
            results[++i] = node;
            callback && callback(node);
          });

        return results;
      }

      __select = NW.Dom.select;
      return (object.rawSelect = rawSelect)(selectors, context, callback);
    }

    function select(selectors, context, callback) {
      function select(selectors, context, callback) {
        var i = -1, results = NodeList();
        __select(
          String(selectors || ''),
          context && fuse.get(context).raw,
          function(node) {
            node = results[++i] = Node(node);
            callback && callback(node);
          });

        return results;
      }

      __select = NW.Dom.select;
      return (object.select = select)(selectors, context, callback);
    }

    var __match, __select;
    object.match = match;
    object.rawSelect = rawSelect;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.Node, fuse.dom.NodeList, fuse.dom.RawList);

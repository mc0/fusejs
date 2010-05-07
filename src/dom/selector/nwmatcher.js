  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  (function(object, NodeList) {
    var __match, __select,

    match = function match(element, selectors, context) {
      function match(element, selectors, context) {
        return __match(
          element.raw || fuse(element).raw,
          String(selectors || ''),
          context && fuse(context).raw);
      }

      __match = NW.Dom.match;
      return (object.match = match)(element, selectors, context);
    },

    select = function select(selectors, context, callback) {
      function select(selectors, context, callback) {
        var i = -1, result = NodeList();
        __select(
          String(selectors || ''),
          context && fuse(context).raw,
          function(node) {
            result[++i] = node;
            callback && callback(node);
          });

        return result;
      }

      __select = NW.Dom.select;
      return (object.select = select)(selectors, context, callback);
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);

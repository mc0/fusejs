  /*----------------------------- SELECTOR: SLY ------------------------------*/

  fuse[uid] = window.Sly;

  //= require "../../../vendor/sly/Sly.js"

  (function(engine, object, NodeList) {
    var match = function match(element, selectors) {
      return Sly(String(selectors || ''))
        .match(element.raw || fuse(element).raw);
    },

    select = function select(selectors, context, callback) {
      var node, i = -1, result = Sly(String(selectors || ''),
        context && fuse(context).raw || fuse._doc);

      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return NodeList.fromArray(result);
    };

    object.engine = engine;
    object.match  = match;
    object.select = select;

  })(Sly, fuse.dom.selector, fuse.dom.NodeList);

  // restore
  if (fuse[uid]) window.Sly = fuse[uid];
  delete fuse[uid];

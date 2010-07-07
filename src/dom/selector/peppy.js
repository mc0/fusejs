  /*---------------------------- SELECTOR: PEPPY -----------------------------*/

  fuse[uid] = global.peppy;

  //= require "../../../vendor/peppy/peppy.js"

  (function(engine, object, NodeList) {
    var match = function match(element, selectors) {
      element = element.raw || fuse(element).raw;

      var node, i = -1, result = engine.query(String(selectors || ''),
        fuse.dom.getDocument(element));

      while (node = result[++i]) {
        if (node === element) return true;
      }
      return false;
    },

    select = function select(selectors, context, callback) {
      var node, i = -1, result = engine.query(String(selectors || ''),
        context && fuse(context).raw);

      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return NodeList.fromArray(result);
    };

    object.engine = engine;
    object.match  = match;
    object.select = select;

  })(peppy, fuse.dom.selector, fuse.dom.NodeList);

  // restore
  if (fuse[uid]) global.peppy = fuse[uid];
  delete fuse[uid];

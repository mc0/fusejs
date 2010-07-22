  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  fuse[uid] = window.Sizzle;

  //= require "../../../vendor/sizzle/sizzle.js"

  (function(engine, object, NodeList) {
    var match = function match(element, selectors) {
      return engine(String(selectors || ''), null, null,
        [element.raw || fuse(element).raw]).length === 1;
    },

    select = function select(selectors, context, callback) {
      var node, i = -1, result = Sizzle(String(selectors || ''),
        context && fuse(context).raw);

      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return NodeList.fromArray(result);
    };

    object.engine = engine;
    object.match  = match;
    object.select = select;

  })(Sizzle, fuse.dom.selector, fuse.dom.NodeList);

  // restore
  if (fuse[uid]) window.Sizzle = fuse[uid];
  delete fuse[uid];

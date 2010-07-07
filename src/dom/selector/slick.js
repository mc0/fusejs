  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  fuse[uid] = global.Slick;

  //= require "../../../vendor/slick/Source/Slick.Parser.js"
  //= require "../../../vendor/slick/Source/Slick.Finder.js"

  (function(engine, object, NodeList) {
    var match = function match(element, selectors) {
      return engine.match(element.raw || fuse(element).raw,
        String(selectors || ''));
    },

    select = function select(selectors, context, callback) {
      var node, i = -1, result = engine.search(context && fuse(context).raw || fuse._doc,
        String(selectors || ''), NodeList());

      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return result;
    };

    object.engine = engine;
    object.match  = match;
    object.select = select;

  })(Slick, fuse.dom.selector, fuse.dom.NodeList);

  // restore
  if (fuse[uid]) global.Slick = fuse[uid];
  delete fuse[uid];

  /*--------------------------- SELECTOR: NWMATCHER --------------------------*/

  fuse[uid] = global.NW;

  //= require "../../../vendor/nwbox/nwmatcher/src/nwmatcher.js"

  (function(engine, object, NodeList) {
    var engMatch = engine.match, engSelect = engine.select,

    match = function match(element, selectors, context) {
      return engMatch(
        element.raw || fuse(element).raw,
        String(selectors || ''),
        context && fuse(context).raw);
    },

    select = function select(selectors, context, callback) {
      var i = -1, result = NodeList();
      engSelect(
        String(selectors || ''),
        context && fuse(context).raw,
        function(node) {
          result[++i] = node;
          callback && callback(node);
        });

      return result;
    };

    // back compat negated attribute operator '!='
    // comment this out for strict CSS3 compliance
    engine.registerOperator('!=', 'n!="%m"');

    // allow complex :not() selectors
    engine.configure({ 'SIMPLENOT': false });

    object.engine = engine;
    object.match  = match;
    object.select = select;

  })(NW.Dom, fuse.dom.selector, fuse.dom.NodeList);

  // restore
  if (fuse[uid]) global.NW = fuse[uid];
  delete fuse[uid];

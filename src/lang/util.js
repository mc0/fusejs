  /*------------------------------- LANG: UTIL -------------------------------*/

  fuse.addNS('util');

  (function(util) {
    var reSpace  = fuse.RegExp('\\s+'),
     reTrimLeft  = fuse.RegExp('^\\s\\s*'),
     reTrimRight = fuse.RegExp('\\s\\s*$');

    util.$w = function $w(string) {
      if (!isString(string)) return fuse.Array();
      string = fuse.String(string.replace(reTrimLeft, '').replace(reTrimRight, ''));
      return string != '' ? string.split(reSpace) : fuse.Array();
    };

    if (fuse.Array.from) {
      util.$A = fuse.Array.from;
    }
    if (fuse.Hash) {
      util.$H = fuse.Hash;
    }
    if (fuse.Range) {
      util.$R = fuse.Range;
    }
    if (fuse.dom) {
      var doc = global.document;
      util.$ = function $(object) {
        var objects, length = arguments.length;
        if (length > 1) {
          objects = NodeList();
          while (length--) objects[length] = util.$(arguments[length]);
          return objects;
        }
        if (isString(object)) {
          object = doc.getElementById(object || uid);
          return object && fromElement(object);
        }
        // attempt window decorator first, and then node decorator
        return Node(Window(object));
      };

      util.$$ = function $$(selectors) {
        var callback, context, args = slice.call(arguments, 0);
        if (typeof args[args.length - 1] === 'function') {
          callback = args.pop();
        }
        if (!isString(args[args.length - 1])) {
          context = args.pop();
        }

        return fuse.query(args.length
          ? slice.call(args).join(',')
          : selectors, context, callback).get();
      };

      util.$F = function $F(element) {
        element = fuse(element);
        return element && element.getValue
          ? element.getValue()
          : null;
      };
    }

    // prevent JScript bug with named function expressions
    var $ = null, $$ = null, $w = null, $A = null, $F = null, $H = null, $R = null;
  })(fuse.util);

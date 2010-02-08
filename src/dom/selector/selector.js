  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  fuse.addNS('util');

  fuse.addNS('dom.selector');

  (function(object) {
    function $$(selectors) {
      var callback, context, args = slice.call(arguments, 0);
      if (typeof args[args.length - 1] === 'function')
        callback = args.pop();
      if (!isString(args[args.length - 1]))
        context = args.pop();

      return query(args.length
        ? slice.call(args).join(',')
        : selectors, context, callback);
    }

    function query(selectors, context, callback) {
      if (typeof context === 'function') {
        callback = context; context = null;
      }
      return object.select(selectors, context, callback);
    }

    function rawQuery(selectors, context, callback) {
      if (typeof context === 'function') {
        callback = context; context = null;
      }
      return object.rawSelect(selectors, context, callback);
    }

    fuse.util.$$  = $$;
    fuse.query    = query;
    fuse.rawQuery = rawQuery;
  })(fuse.dom.selector);

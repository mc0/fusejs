  /*--------------------------- ELEMENT: SELECTOR ----------------------------*/

  fuse.addNS('dom.selector');

  (function(plugin) {
    plugin.match = function match(selectors) {
      return isString(selectors)
        ? fuse.dom.selector.match(this, selectors)
        : selectors.match(this);
    };

    plugin.query = function query(selectors, callback) {
      return fuse.dom.selector.select(selectors, this, callback);
    };

    fuse.query = function query(selectors, context, callback) {
      if (typeof context === 'function') {
        callback = context; context = null;
      }
      return fuse.dom.selector.select(selectors, context, callback);
    };

    // prevent JScript bug with named function expressions
    var match = nil, query = nil;
  })(fuse.dom.Element.plugin);

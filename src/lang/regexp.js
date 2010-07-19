  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function(plugin) {
    fuse.RegExp.escape = function escape(string) {
      return fuse.String(escapeRegExpChars(string));
    };

    plugin.clone = function clone(options) {
      options = fuse.Object.extend({
        'global':     this.global,
        'ignoreCase': this.ignoreCase,
        'multiline':  this.multiline
      }, options);

      return fuse.RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    };

    // prevent JScript bug with named function expressions
    var clone = null, escape = null;
  })(fuse.RegExp.plugin);

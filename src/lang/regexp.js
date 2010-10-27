  /*------------------------------ LANG: REGEXP ------------------------------*/

  (function(RegExp) {

    function escape(string) {
      return escape[ORIGIN].String(fuse._.escapeRegExpChars(string));
    }

    function clone(options) {
      options = fuse.Object.extend({
        global:     this.global,
        ignoreCase: this.ignoreCase,
        multiline:  this.multiline
      }, options);

      return clone[ORIGIN].RegExp(this.source,
        (options.global     ? 'g' : '') +
        (options.ignoreCase ? 'i' : '') +
        (options.multiline  ? 'm' : ''));
    }

    (RegExp.escape = escape)[ORIGIN] =
    (RegExp.plugin.clone = clone)[ORIGIN] = fuse;

  })(fuse.RegExp);

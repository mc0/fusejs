  /*--------------------------- FEATURE/BUG TESTER ---------------------------*/

  (function(env) {
    var cache = { },

    addTest = function addTest(name, value) {
      if (typeof name === 'object') {
        for (var i in name) cache[i] = name[i];
      } else cache[name] = value;
    },

    removeTest = function removeTest(name) {
      name = name.valueOf();
      if (typeof name === 'string') delete cache[name];
      else { for (var i in name) delete cache[i]; }
    },

    test = function test(name) {
      var i = 0;
      while (name = arguments[i++]) {
        if (typeof cache[name] === 'function')
          cache[name] = cache[name]();
        if (cache[name] !== true) return false;
      }
      return true;
    };

    envAddTest =
    env.addTest = addTest;

    envTest =
    env.test = test;

    env.removeTest = removeTest;
  })(fuse.env);

  /*-------------------------- LANG FEATURES / BUGS --------------------------*/

  envAddTest({
    'ACTIVE_X_OBJECT': function() {
      // true for IE
      return isHostType(global, 'ActiveXObject');
    },

    'JSON': function() {
      // true for IE8 and newer browsers
      return typeof global.JSON === 'object' &&
        typeof JSON.parse === 'function' &&
        typeof JSON.stringify === 'function' &&
        typeof JSON.stringify(NOOP) === 'undefined' &&
        JSON.stringify(0) === '0' && !!JSON.parse('{ "x": true }').x;
    },

    'OBJECT__PROTO__': function() {
      // true for Gecko and Webkit
      if ([ ]['__proto__'] === Array.prototype  &&
          { }['__proto__'] === Object.prototype) {
        // test if it's writable and restorable
        var result, list = [], backup = list['__proto__'];
        list['__proto__'] = { };
        result = typeof list.push === 'undefined';
        list['__proto__'] = backup;
        return result && typeof list.push === 'function';
      }
    },

    'STRING_REPLACE_COERCE_FUNCTION_TO_STRING': function() {
      // true for Safari 2
      var func = function() { return ''; };
      return 'x'.replace(/x/, func) === String(func);
    },

    'STRING_SPLIT_BUGGY_WITH_REGEXP': function() {
      // true for IE
      return 'x'.split(/x/).length !== 2 || 'oxo'.split(/x(y)?/).length !== 3;
    }
  });

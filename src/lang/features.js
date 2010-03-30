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

  /*----------------------------- LANG FEATURES ------------------------------*/

  envAddTest({
    'ACTIVE_X_OBJECT': function() {
      // true for IE
      return isHostObject(global, 'ActiveXObject');
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
    }
  });

  /*-------------------------------- LANG BUGS -------------------------------*/

  envAddTest({
    'ARRAY_CONCAT_ARGUMENTS_BUGGY': function() {
      // true for Opera
      var array = [];
      return (function() { return array.concat &&
        array.concat(arguments).length === 2; })(1, 2);
    },

    'ARRAY_SLICE_EXLUDES_TRAILING_UNDEFINED_INDEXES': function() {
      // true for Opera 9.25
      var array = [1]; array[2] = 1;
      return array.slice && array.slice(0, 2).length === 1;
    },

    'REGEXP_EXEC_RETURNS_UNDEFINED_VALUES_AS_STRINGS': function() {
      // true for IE; String#match is affected too
      return typeof /x(y)?/.exec('x')[1] === 'string'; 
    },

    'REGEXP_INCREMENTS_LAST_INDEX_AFTER_ZERO_LENGTH_MATCHES': function() {
      // true for IE
      var pattern = /^/g, data = [];
      data[0] = !!pattern.test('').lastIndex;
      ''.match(pattern);
      data[1] = !!pattern.lastIndex;
      return data[0] || data[1];
    },

    'STRING_LAST_INDEX_OF_BUGGY_WITH_NEGATIVE_OR_NAN_POSITION': function() {
       // true for Chrome 1-2 and Opera 9.25
       var string = 'xox';
       return string.lastIndexOf('x', -1) !== 0 ||
         string.lastIndexOf('x', +'x') !== 2
    },

    'STRING_METHODS_WRONGLY_SET_REGEXP_LAST_INDEX': function() {
      // true for IE
      var string = 'oxo', data = [], pattern = /x/;
      string.replace(pattern, '');
      data[0] = !!pattern.lastIndex;
      string.match(pattern);
      data[1] = !!pattern.lastIndex;
      string.search(pattern);
      data[2] = !!pattern.lastIndex;
      return data[0] || data[1] || data[2];
    },

    'STRING_REPLACE_COERCE_FUNCTION_TO_STRING': function() {
      // true for Safari 2
      var func = function() { return ''; };
      return 'x'.replace(/x/, func) === String(func);
    },

    'STRING_REPLACE_BUGGY_WITH_GLOBAL_FLAG_AND_EMPTY_PATTERN': function() {
      // true for Chrome 1
      var string = 'xy', replacement = function() { return 'o'; };
      return !(string.replace(/()/g, 'o') === 'oxoyo' &&
        string.replace(new RegExp('', 'g'), replacement) === 'oxoyo' &&
        string.replace(/(y|)/g, replacement) === 'oxoo');
    },

    'STRING_REPLACE_PASSES_UNDEFINED_VALUES_AS_STRINGS': function() {
      // true for Firefox
      var result;
      'x'.replace(/x(y)?/, function(x, y) { result = typeof y === 'string'; });
      return result; 
    },

    'STRING_SPLIT_BUGGY_WITH_REGEXP': function() {
      // true for IE
      return 'x'.split(/x/).length !== 2 || 'oxo'.split(/x(y)?/).length !== 3;
    },

    'STRING_SPLIT_RETURNS_UNDEFINED_VALUES_AS_STRINGS': function() {
      // true for Firefox
      var result = 'oxo'.split(/x(y)?/);
      return result.length === 3 && typeof result[1] === 'string'; 
    },

    'STRING_SPLIT_ZERO_LENGTH_MATCH_RETURNS_NON_EMPTY_ARRAY': function() {
      return !!''.split(/^/).length;
    },

    'STRING_TRIM_INCOMPLETE': function() {
      // true for Firefox
      var key, sMap = fuse.RegExp.SPECIAL_CHARS.s, whitespace = '';
      for (key in sMap) whitespace += key;
      return typeof whitespace.trim !== 'function' || !!whitespace.trim();
    }
  });

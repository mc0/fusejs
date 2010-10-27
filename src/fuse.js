/* FuseJS JavaScript framework, version <%= Version %>
 * (c) 2008-2010 John-David Dalton
 *
 * Prototype JavaScript framework, version 1.6.0.2
 * (c) 2005-2010 Sam Stephenson
 *
 * FuseJS and Prototype are distributed under an MIT-style license.
 * For details, see the FuseJS website: <http://www.fusejs.com/license.txt>
 * or the Prototype website: <http://www.prototypejs.org>
 *
 * Built: <%= Built %>
 * ----------------------------------------------------------------------------*/

(function(window) {

  window.fuse = (function() {
    function fuse() { };
    return fuse;
  })();

  fuse.uid = 'uid' + String(+new Date).slice(0, 12);

  fuse.version = '<%= Version %>';

  fuse.debug = (function() {
    var match, script, doc = window.document, i = -1,
     reSrcDebug = /(?:^|&)(debug)(?:=(.*?))?(?:&|$)/,
     reFilename = /(^|\/)fuse\b.*?\.js\?/,
     scripts = doc && doc.getElementsByTagName('script') || [],
     query = window.location && location.search;

    if (!(match = query.match(/(?:\?|&)(fusejs_debug)(?:=(.*?))?(?:&|$)/))) {
      while (script = scripts[++i]) {
        if (reFilename.test(script.src) &&
            (match = (script.src.split('?')[1] || '').match(reSrcDebug))) {
          break;
        }
      }
    }
    return !!match && (match[2] == null ? true : isNaN(+match[2]) ? match[2] : +match[2]);
  })();

  /*--------------------------------------------------------------------------*/

  fuse._ = {

    counter: 0,

    rawIndexOf: ''.indexOf,

    rawReplace: ''.replace,
    
    addNodeListMethod: function() { },

    arrIndexOf: function(value) {
      var length = this.length;
      while (length--) {
        if (this[length] === value) return length;
       }
       return -1;
    },

    capitalize: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    cloneMethod: (function() {
      function cloneMethod(method, origin) {
        // init on method to avoid problems when cloning itself
        var result, source = String(method);
        cloneMethod.varOrigin || (cloneMethod.varOrigin =
          String(function() { return ORIGIN }).match(/return\s+([^}\s]*)/)[1]);

        result = Function(
          'var ' + cloneMethod.varOrigin + '="' +
          ORIGIN + '";' + source + '; return ' +
          source.match(/^[\s\(]*function([^(]*)\(/)[1])();
  
        result[ORIGIN] = origin;
        return result;
      }

      try {
        if (String(cloneMethod(cloneMethod)(cloneMethod)).indexOf('cloneMethod') < 0) {
          throw 1;
        }
        return cloneMethod;
      }
      catch (e) {
        return function(method, origin) {
          var result = function() {
            var ret, backup = method[ORIGIN];
            method[ORIGIN] = result[ORIGIN];
            ret = method.apply(this, arguments);
            method[ORIGIN] = backup;
            return ret;
          };
          result[ORIGIN] = origin;
          return result;
        }
      }
    })(),

    concatList: function(list, otherList) {
      var pad = list.length, length = otherList.length;
      while (length--) list[pad + length] = otherList[length];
      return list;
    },

    createGetter: function(name, value) {
      return Function('v', 'function ' + name + '(){return v;} return ' + name)(value);
    },

    escapeRegExpChars: (function() {
      var reSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
      return function(string) {
        return String(string).replace(reSpecialChars, '\\$1');
      };
    })(),

    prependList: function(list, value, result) {
      (result || (result = []))[0] = value;
      var length = list.length;
      while (length--) result[1 + length] = list[length];
      return result;
    },

    returnPair: function(pair) {
      var key, value;
      pair = fuse.Array(key = pair[0], value = pair[1]);
      pair.key = key;
      pair.value = value;
      return pair;
    },

    strReplace: function(pattern, replacement) {
      var p = fuse._, fn = fuse.String.plugin.replace;
      return (p.strReplace =
        fuse.env.test('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
          fn : fn.raw).call(this, pattern, replacement);
    },

    strSplit: function(separator, limit) {
      var p = fuse._, fn = fuse.String.plugin.split;
      return (p.strSplit =
        fuse.env.test('STRING_SPLIT_BUGGY_WITH_REGEXP') ?
          fn : fn.raw).call(this, separator, limit);
    },

    // ES5 9.4 ToInteger implementation
    toInteger: function(object) {
      // avoid issues with numbers larger than
      // Math.pow(2, 31) against bitwise operators
      var number = +object;
      return number === 0 || !isFinite(number)
        ? number || 0
        : Math.abs(number) < 2147483648 ? number | 0 : number - (number % 1);
    },

    // used to access an object's internal [[Class]] property
    // redefined later if there is no issues grabbing sandboxed natives [[Class]]
    toString: {
      'call': (function() {
        var __toString = {}.toString;
        return function(object) {
          return object != null && object['[[Class]]'] || __toString.call(object);
        };
      })()
    }
  };

  /*--------------------------------------------------------------------------*/

  (function() {

    function addNS(path) {
      var Klass, key, i = -1,
       object = this,
       keys   = path.split('.'),
       length = keys.length;

      while (key = keys[++i]) {
        if (!object[key]) {
          Klass = fuse.Class(object.constructor.superclass || object, { 'constructor': key });
          object = object[key] = new Klass;
          object.plugin = Klass.plugin;
        } else {
          object = object[key];
        }
      }
      return object;
    }

    function getNS(path) {
      var key, i = -1, keys = path.split('.'), object = this;
      while (key = keys[++i]) {
        if (!(object = object[key])) {
          return false;
        }
      }
      return object;
    }

    function updateGenerics(path, deep) {
      var paths, object, i = -1;
      if (fuse.Object.isString(paths)) {
        paths = [paths];
      }
      if (!fuse.Object.isArray(paths)) {
        deep  = path;
      }
      if (!paths) {
        paths = ['Array', 'Date', 'Number', 'Object', 'RegExp', 'String', 'dom.Event', 'dom.Node'];
      }

      while (path = paths[++i]) {
        object = fuse.Object.isString(path) ? fuse.getNS(path) : path;
        if (object) {
          if (fuse.Object.isFunction(object.updateGenerics)) {
            object.updateGenerics();
          }
          if (deep) {
            updateSubClassGenerics(object);
          }
        }
      }
    }

    function updateSubClassGenerics(object) {
      var subclass, subclasses = object.subclasses || [], i = -1;
      while (subclass = subclasses[++i]) {
        if (fuse.Object.isFunction(subclass.updateGenerics)) {
          subclass.updateGenerics();
        }
        updateSubClassGenerics(subclass);
      }
    }

    fuse.getNS =
    fuse.prototype.getNS = getNS;
    fuse.addNS =
    fuse.prototype.addNS = addNS;
    fuse.updateGenerics = updateGenerics;
  })();

  //= require "env"
  //= require "lang/features"
  //= require "lang/fusebox"

  //= require "lang/object"
  //= require "lang/class"
  //= require "lang/event"

  //= require "lang/function"
  //= require "lang/enumerable"
  //= require "lang/array"
  //= require "lang/number"
  //= require "lang/regexp"
  //= require "lang/string"

  //= require "lang/hash"
  //= require "lang/range"
  //= require "lang/template"
  //= require "lang/timer"

  //= require "dom/features"
  //= require "dom/dom"
  //= require "dom/node"
  //= require "dom/document"
  //= require "dom/window"

  //= require "dom/element/create"
  //= require "dom/element/element"
  //= require "dom/element/modification"
  //= require "dom/element/attribute"
  //= require "dom/element/style"
  //= require "dom/element/position"
  //= require "dom/element/traversal"

  //= require "dom/form/field"
  //= require "dom/form/form"
  //= require "dom/form/event-observer"
  //= require "dom/form/timed-observer"

  //= require "dom/node-list"
  //= require "dom/selector/selector"
  //= require "dom/selector/nwmatcher"

  //= require "dom/event/event"
  //= require "dom/event/delegate"

  //= require "lang/console"
  //= require "lang/ecma"
  //= require "lang/grep"
  //= require "lang/html"
  //= require "lang/inspect"
  //= require "lang/json"
  //= require "lang/query"
  //= require "lang/script"

  //= require "ajax/ajax"
  //= require "ajax/responders"
  //= require "ajax/base"
  //= require "ajax/request"
  //= require "ajax/updater"
  //= require "ajax/timed-updater"
  /*--------------------------------------------------------------------------*/

  (function(dom, origin) {
    if (dom) {
      if (dom.HTMLFormElement) {
        fuse.Object.each(dom.HTMLFormElement.plugin, fuse._.addNodeListMethod);
      }
      if (dom.HTMLInputElement) {
        fuse.Object.each(dom.HTMLInputElement.plugin, fuse._.addNodeListMethod);
      }
      
      fuse.Object.each(dom.HTMLElement.plugin, fuse._.addNodeListMethod);
      fuse.Object.each(dom.Element.plugin, fuse._.addNodeListMethod);

      if (dom.NodeList) {
        // Pave any NodeList methods that fuse.Array shares.
        // Element first(), last(), and contains() may be called by using invoke()
        // Ex: elements.invoke('first');
        var nlPlugin = dom.NodeList.plugin;
        fuse.Object.each(fuse.Array.plugin, function(value, key) {
          if (value[ORIGIN]) {
            nlPlugin[key] = fuse._.cloneMethod(value, origin);
          }
          else if (!nlPlugin[key]) {
            nlPlugin[key] = value;
          }
        });

        dom.NodeList.from = fuse._.cloneMethod(fuse.Array.from, origin);
        dom.NodeList.fromNodeList = fuse._.cloneMethod(fuse.Array.fromNodeList, origin);
      }
    }
  })(fuse.dom, { 'Number': fuse.Number, 'Array': NodeList });

})(this);

(function(window) {
  //= require "dom/event/dispatcher.js"
  //= require "dom/event/dom-loaded.js"
})(this);

// update native generics and element methods
fuse.updateGenerics(true);

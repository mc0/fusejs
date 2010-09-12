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

  // private vars
  var CHECKED_INPUT_TYPES, CONTROL_PLUGINS, DATA_ID_PROP, EVENT_TYPE_ALIAS,
   INPUT_BUTTONS, PARENT_NODE, PARENT_WINDOW, Node, NodeList, Element,
   HTMLDocument, HTMLElement, HTMLButtonElement, HTMLFormElement,
   HTMLInputElement, HTMLOptionElement, HTMLSelectElement, HTMLTextAreaElement,
   Window, destroyElement, domData, eachKey, emptyElement, envAddTest, envTest,
   extendByTag, fromElement, getDocument, getFragmentFromHTML, getFuseId,
   getNodeName, getScriptText, getWindow, getOrCreateTagClass, hasKey, isArray,
   isElement, isHash, isNumber, isPrimitive, isRegExp, isString, returnOffset,
   runScriptText, setScriptText, undef,

  DOCUMENT_FRAGMENT_NODE = 11,

  DOCUMENT_NODE = 9,

  ELEMENT_NODE = 1,

  TEXT_NODE = 3,

  IDENTITY = function IDENTITY(x) { return x; },

  NOOP = function NOOP() { },

  NON_HOST_TYPES = { 'boolean': 1, 'number': 1, 'string': 1, 'undefined': 1 },

  ORIGIN = '__origin__',

  slice = [].slice,

  setTimeout = window.setTimeout,

  uid = 'uid' + String(+new Date).slice(0, 12),

  userAgent = window.navigator && navigator.userAgent || '',

  addNodeListMethod = NOOP,

  capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  cloneMethod = (function() {
    function cloneMethod(method, origin) {
      var result, source = String(method);
      if (!cloneMethod.reName) {
        // init props on method to avoid problems when cloning itself
        cloneMethod.reName = /^[\s\(]*function([^(]*)\(/;
        cloneMethod.varOrigin = String(function() { return ORIGIN })
          .match(/return\s+([^}\s]*)/)[1];
      }
      result = Function(
        'var ' + cloneMethod.varOrigin + '="' +
        ORIGIN + '";' + source + '; return ' + 
        source.match(cloneMethod.reName)[1])();

      origin && method[ORIGIN] && (result[ORIGIN] = origin);
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
        return function() {
          var result, backup = method[ORIGIN];
          backup && (method[ORIGIN] = origin);
          result = method.apply(this, arguments);
          backup && (method[ORIGIN] = backup);
          return result;
        };
      }
    }
  })(),

  concatList = function(list, otherList) {
    var pad = list.length, length = otherList.length;
    while (length--) list[pad + length] = otherList[length];
    return list;
  },

  createGetter = function(name, value) {
    return Function('v', 'function ' + name + '(){return v;} return ' + name)(value);
  },

  debug = (function() {
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
  })(),

  escapeRegExpChars = (function() {
    var reSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
    return function(string) {
      return String(string).replace(reSpecialChars, '\\$1');
    };
  })(),

  isFunction = function isFunction(value) {
    return toString.call(value) == '[object Function]';
  },

  // Host objects can return type values that are different from their actual
  // data type. The objects we are concerned with usually return non-primitive
  // types of object, function, or unknown.
  isHostType = function isHostType(object, property) {
    var type = typeof object[property];
    return type == 'object' ? !!object[property] : !NON_HOST_TYPES[type];
  },

  prependList = function(list, value, result) {
    (result || (result = []))[0] = value;
    var length = list.length;
    while (length--) result[1 + length] = list[length];
    return result;
  },

  // ES5 9.4 ToInteger implementation
  toInteger = function(object) {
    // avoid issues with numbers larger than
    // Math.pow(2, 31) against bitwise operators
    var number = +object;
    return number === 0 || !isFinite(number)
      ? number || 0
      : Math.abs(number) < 2147483648 ? number | 0 : number - (number % 1);
  },

  // used to access an object's internal [[Class]] property
  // redefined later if there is no issues grabbing sandboxed natives [[Class]]
  toString = {
    'call': (function() {
      var __toString = {}.toString;
      return function(object) {
        return object != null && object['[[Class]]'] || __toString.call(object);
      };
    })()
  };

  window.fuse = (function() {
    var fuse = function fuse() { };
    fuse.version = '<%= Version %>';
    return fuse;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {
    var addNS = function addNS(path) {
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
    },

    getNS = function getNS(path) {
      var key, i = -1, keys = path.split('.'), object = this;
      while (key = keys[++i])
        if (!(object = object[key])) return false;
      return object;
    },

    updateGenerics = function updateGenerics(path, deep) {
      var paths, object, i = -1;
      if (isString(paths)) paths = [paths];
      if (!isArray(paths)) deep  = path;
      if (!paths) paths = ['Array', 'Date', 'Number', 'Object', 'RegExp', 'String', 'dom.Event', 'dom.Node'];

      while (path = paths[++i]) {
        object = isString(path) ? fuse.getNS(path) : path;
        if (object) {
          if (isFunction(object.updateGenerics)) object.updateGenerics();
          deep && updateSubClassGenerics(object);
        }
      }
    },

    updateSubClassGenerics = function(object) {
      var subclass, subclasses = object.subclasses || [], i = -1;
      while (subclass = subclasses[++i]) {
        if (isFunction(subclass.updateGenerics)) subclass.updateGenerics();
        updateSubClassGenerics(subclass);
      }
    };

    fuse.getNS =
    fuse.prototype.getNS = getNS;

    fuse.addNS =
    fuse.prototype.addNS = addNS;

    fuse.uid = uid;
    fuse.debug = debug;
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
  //= require "lang/util"

  //= require "ajax/ajax"
  //= require "ajax/responders"
  //= require "ajax/base"
  //= require "ajax/request"
  //= require "ajax/updater"
  //= require "ajax/timed-updater"
  /*--------------------------------------------------------------------------*/

  if (fuse.dom && NodeList) {
    HTMLFormElement && eachKey(HTMLFormElement.plugin, addNodeListMethod);
    HTMLInputElement && eachKey(HTMLInputElement.plugin, addNodeListMethod);

    eachKey(HTMLElement.plugin, addNodeListMethod);
    eachKey(Element.plugin, addNodeListMethod);

    (function(origin) {
      // Pave any NodeList methods that fuse.Array shares.
      // Element first(), last(), and contains() may be called by using invoke()
      // Ex: elements.invoke('first');
      var nlPlugin = NodeList.plugin;
      eachKey(fuse.Array.plugin, function(value, key) {
        if (value[ORIGIN] || !nlPlugin[key])
          nlPlugin[key] = cloneMethod(value, origin);
      });

      NodeList.from = cloneMethod(fuse.Array.from, origin);
      NodeList.fromNodeList = cloneMethod(fuse.Array.fromNodeList, origin);
    })({ 'Number': fuse.Number, 'Array': NodeList });
  }
})(this);

(function(window) {
  //= require "dom/event/dispatcher.js"
  //= require "dom/event/dom-loaded.js"
})(this);

// update native generics and element methods
fuse.updateGenerics(true);

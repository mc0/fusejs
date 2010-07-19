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

(function(global) {

  // private vars
  var DATA_ID_PROP, Document, Element, Node, NodeList, Window,
   domData, eachKey, envAddTest, envTest, fromElement, getDocument, getFuseId,
   getNodeName, getWindow, getOrCreateTagClass, hasKey, isArray, isElement,
   isHash, isNumber, isPrimitive, isRegExp, isString, returnOffset, undef,

  DOCUMENT_FRAGMENT_NODE = 11,

  DOCUMENT_NODE = 9,

  ELEMENT_NODE = 1,

  TEXT_NODE = 3,

  IDENTITY = function IDENTITY(x) { return x; },

  NOOP = function NOOP() { },

  NON_HOST_TYPES = { 'boolean': 1, 'number': 1, 'string': 1, 'undefined': 1 },

  slice = [].slice,

  setTimeout = global.setTimeout,

  uid = 'uid' + String(+new Date).slice(0, 12),

  userAgent = global.navigator && navigator.userAgent || '',

  addNodeListMethod = NOOP,

  addArrayMethods = (function() {
    var result = function(List) {
      var callbacks = addArrayMethods.callbacks, i = -1;
      while (callbacks[++i]) callbacks[i](List);
    };
    result.callbacks = [];
    return result;
  })(),

  capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  concatList = function(list, otherList) {
    var pad = list.length, length = otherList.length;
    while (length--) list[pad + length] = otherList[length];
    return list;
  },

  createGetter = function(name, value) {
    return Function('v', 'function ' + name + '(){return v;} return ' + name)(value);
  },

  escapeRegExpChars = (function() {
    var reSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
    return function(string) {
      return String(string).replace(reSpecialChars, '\\$1');
    };
  })(),

  isFunction = function isFunction(value) {
    return toString.call(value) === '[object Function]';
  },

  // Host objects can return type values that are different from their actual
  // data type. The objects we are concerned with usually return non-primitive
  // types of object, function, or unknown.
  isHostType = function isHostType(object, property) {
    var type = typeof object[property];
    return type === 'object' ? !!object[property] : !NON_HOST_TYPES[type];
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

  /**
  * ## fuse.version
  *
  * The version of [FuseJS](http://fusejs.com) that you're using (e.g., <%= Version %>).
  */
  global.fuse = (function() {
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

    fuse.updateGenerics  = updateGenerics;
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

  //= require "lang/console"
  //= require "lang/hash"
  //= require "lang/range"
  //= require "lang/template"
  //= require "lang/timer"

  //= require "lang/html"
  //= require "dom/dom"
  //= require "dom/features"
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

  //= require "lang/ecma"
  //= require "lang/grep"
  //= require "lang/inspect"
  //= require "lang/json"
  //= require "lang/query"
  //= require "lang/util"

  //= require "ajax/ajax"
  //= require "ajax/responders"
  //= require "ajax/base"
  //= require "ajax/request"
  //= require "ajax/updater"
  //= require "ajax/timed-updater"
  /*--------------------------------------------------------------------------*/

  addArrayMethods(fuse.Array);

  (function(dom) {
    var Field, Form, NodeList;
    if (dom && (NodeList = dom.NodeList)) {
      if (Form = dom.FormElement) eachKey(Form.plugin, addNodeListMethod);
      if (Field = dom.InputElement) eachKey(Field.plugin, addNodeListMethod);
      eachKey(dom.Element.plugin, addNodeListMethod);

      // Pave any NodeList methods that fuse.Array shares.
      // Element first(), last(), and contains() may be called by using invoke()
      // Ex: elements.invoke('first');
      addArrayMethods(NodeList);
    }
  })(fuse.dom);

})(this);

(function(global) {
  //= require "dom/event/dispatcher.js"
  //= require "dom/event/dom-loaded.js"
})(this);

// update native generics and element methods
fuse.updateGenerics(true);

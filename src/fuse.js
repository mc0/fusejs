/* FuseJS JavaScript framework, version <%= Version %>
* (c) 2008-2010 John-David Dalton
*
* Prototype JavaScript framework, version 1.6.1
* (c) 2008-2010 Sam Stephenson
*
* FuseJS and Prototype are distributed under an MIT-style license.
* For details, see the FuseJS website: <http://www.fusejs.com/license.txt>
* or the Prototype website: <http://www.prototypejs.org>
*
* Built: <%= Built %>
* ----------------------------------------------------------------------------*/

(function(global) {

  // private vars
  var DATA_ID_PROP, DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE, ELEMENT_NODE,
   IDENTITY, NOOP, TEXT_NODE, Document, Element, Node, NodeList, Window,
   addArrayMethods, addNodeListMethod, capitalize, concatList, createGetter,
   domData, eachKey, envAddTest, envTest, escapeRegExpChars, expando,
   fromElement, getDocument, getFuseId, getNodeName, getWindow,
   getOrCreateTagClass, hasKey, isArray, isElement, isHash, isHostType,
   isFunction, isNumber, isPrimitive, isRegExp, isString, nil, prependList,
   returnOffset, setTimeout, slice, toInteger, toString, undef, userAgent;

  global.fuse = (function() {
    var fuse = function fuse() { };
    return fuse;
  })();

  fuse.version = '<%= Version %>';

  /*--------------------------------------------------------------------------*/

  IDENTITY = function IDENTITY(x) { return x; };

  NOOP =
  addNodeListMethod = function NOOP() { };

  addArrayMethods = function(List) {
    var callbacks = addArrayMethods.callbacks, i = -1;
    while (callbacks[++i]) callbacks[i](List);
  };

  addArrayMethods.callbacks = [];

  capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  concatList = function(list, otherList) {
    var pad = list.length, length = otherList.length;
    while (length--) list[pad + length] = otherList[length];
    return list;
  };

  createGetter = function(name, value) {
    return Function('v', 'function ' + name + '(){return v;} return ' + name)(value);
  };

  escapeRegExpChars = (function() {
    var reSpecialChars = /([.*+?^=!:${}()|[\]\/\\])/g;
    return function(string) {
      return String(string).replace(reSpecialChars, '\\$1');
    };
  })();

  // Allow a pre-sugared array to be passed
  prependList = function(list, value, result) {
    (result || (result = []))[0] = value;
    var length = list.length;
    while (length--) result[1 + length] = list[length];
    return result;
  };

  isFunction = function isFunction(value) {
    return toString.call(value) === '[object Function]';
  };

  // Host objects can return type values that are different from their actual
  // data type. The objects we are concerned with usually return non-primitive
  // types of object, function, or unknown.
  //
  // For example:
  // typeof document.createElement('div').offsetParent -> unknown
  // typeof document.createElement -> object
  // typeof Image.create -> string
  isHostType = (function() {
    var NON_HOST_TYPES = { 'boolean': 1, 'number': 1, 'string': 1, 'undefined': 1 },

    isHostType = function isHostType(object, property) {
      var type = typeof object[property];
      return type === 'object' ? !!object[property] : !NON_HOST_TYPES[type];
    };
    return isHostType;
  })();

  // ES5 9.4 ToInteger implementation
  toInteger = function(object) {
    // fast coerce to number
    var number = +object;
    // avoid issues with numbers larger than
    // Math.pow(2, 31) against bitwise operators
    return number == 0 || !isFinite(number)
      ? number || 0
      : Math.abs(number) < 2147483648 ? number | 0 : number - (number % 1);
  };

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

  // global.document.createDocumentFragment() nodeType
  DOCUMENT_FRAGMENT_NODE = 11;

  // global.document node type
  DOCUMENT_NODE = 9;

  // element node type
  ELEMENT_NODE = 1;

  // textNode type
  TEXT_NODE = 3;

  // a unqiue 15 char id used throughout fuse
  expando = '_fuse' + String(+new Date).slice(0, 10);

  // helps minify nullifying the JScript function declarations
  nil = null;

  // a quick way to copy an array slice.call(array, 0)
  slice = [].slice;

  // shortcut
  setTimeout = global.setTimeout;

  // used for some required browser sniffing
  userAgent = global.navigator && navigator.userAgent || '';

  /*--------------------------------------------------------------------------*/

  (function() {
    var getNS = function getNS(path) {
      var key, i = -1, keys = path.split('.'), object = this;
      while (key = keys[++i])
        if (!(object = object[key])) return false;
      return object;
    },

    addNS = function addNS(path) {
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

    updateSubClassGenerics = function(object) {
      var subclass, subclasses = object.subclasses || [], i = -1;
      while (subclass = subclasses[++i]) {
        if (isFunction(subclass.updateGenerics)) subclass.updateGenerics();
        updateSubClassGenerics(subclass);
      }
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
  //= require "lang/query"
  //= require "lang/json"
  //= require "lang/util"

  //= require "ajax/ajax"
  //= require "ajax/responders"
  //= require "ajax/base"
  //= require "ajax/request"
  //= require "ajax/updater"
  //= require "ajax/timed-updater"

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
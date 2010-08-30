  /*-------------------------- HTML ELEMENT: CREATE --------------------------*/

  Element =
  fuse.dom.Element = (function() {

    var Decorator = function() { },

    Element = function Element(node, isCached) {
      // quick return if empty, decorated, or not an element node
      var data, decorated;
      if (!node || node.raw || node.nodeType != ELEMENT_NODE) {
        return node;
      }
      if (isCached === false) {
        decorated = new Decorator;
      } else {
        // return cached if available
        data = domData[Node.getFuseId(node)];
        if (data.decorator) {
          return data.decorator;
        }
        decorated =
        data.decorator = new Decorator;
      }

      decorated.raw = node;
      decorated.nodeName = node.nodeName;
      decorated.nodeType = ELEMENT_NODE;
      return decorated;
    };

    fuse.Class(Node, { 'constructor': Element });
    Decorator.prototype = Element.plugin;
    Element.updateGenerics = Node.updateGenerics;
    return Element;
  })();

  /*--------------------------------------------------------------------------*/

  (function() {

    var plugin,

    ELEMENT_INNERHTML_IGNORES_SCRIPTS =
      envTest('ELEMENT_INNERHTML_IGNORES_SCRIPTS'),

    ELEMENT_TABLE_INNERHTML_INSERTS_TBODY =
      envTest('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY'),

    CONTEXT_TYPES = (function() {
      var T = { };
      T[ELEMENT_NODE] =
      T[DOCUMENT_NODE] = 1;
      return T;
    })(),

    FROM_STRING_PARENT_WRAPPERS = (function() {
      var T = {
        'COLGROUP': ['<table><colgroup>',      '<\/colgroup><tbody><\/tbody><\/table>', 2],
        'FIELDSET': ['<form><fieldset>',       '<\/fieldset><\/form>',                  2],
        'LEGEND':   ['<form>',                 '<\/form>',                              1],
        'MAP':      ['<map>',                  '<\/map>',                               1],
        'SELECT':   ['<form><select>',         '<\/select><\/form>',                    2],
        'TABLE':    ['<table>',                '<\/table>',                             1],
        'TBODY':    ['<table><tbody>',         '<\/tbody><\/table>',                    2],
        'TR':       ['<table><tbody><tr>',     '<\/tr><\/tbody><\/table>',              3],
        'TD':       ['<table><tbody><tr><td>', '<\/td><\/tr><\/tbody><\/table>',        4]
      };

      // TODO: Opera fails to render optgroups when set with innerHTML
      T['TH'] = T['TD'];
      T['OPTGROUP'] = T['SELECT'];
      T['TFOOT'] = T['THEAD'] = T['TBODY'];
      return T;
    })(),

    FROM_STRING_CHILDREN_PARENTS = (function() {
      var T = {
        'AREA':     'MAP',
        'COL':      'COLGROUP',
        'FIELDSET': 'FORM',
        'LEGEND':   'FIELDSET',
        'OPTION':   'SELECT',
        'TD':       'TR',
        'TR':       'TBODY',
        'TBODY':    'TABLE'
      };

      T['TH'] = T['TD'];
      T['OPTGROUP'] = T['OPTION'];
      T['TFOOT'] = T['THEAD'] = T['TBODY'];
      T['CAPTION'] = T['COLGROUP'] = T['TBODY'];
      return T;
    })(),

    __fuse = window.fuse,

    Node   = __fuse.dom.Node,

    Window = __fuse.dom.Window,

    doc    = __fuse._doc,

    getFuseId = Node.getFuseId,

    reSimpleTag = /^<([A-Za-z0-9]+)\/?>$/,

    reTagStart = /^\s*</,

    reTBody = /<tbody /i,

    reExtractTagName = /^<([^> ]+)/,

    reStartsWithTR = /^<tr/i,

    Decorator = function(element) {
      this.raw = element;
      this.style = element.style;
      this.nodeType = ELEMENT_NODE;
      this.childNodes = element.childNodes;
      this.tagName = this.nodeName = element.nodeName;
      this.initialize && this.initialize();
    },

    HTMLElement = function HTMLElement(tagName, context) {
      var attrs, element, result,
        options = !CONTEXT_TYPES[context && context.nodeType] && context;

      if (isString(tagName)) {
        result = (tagName.charAt(0) == '<' ? fromHTML : fromTagName)(tagName, context);
      } else {
        result = fromElement(tagName, context);
      }
      return (attrs = options && options.attrs)
        ? plugin.setAttribute.call(result, attrs)
        : result;
    },

    from = function from(element, context) {
      return window.fuse(element, context);
    },

    fromElement = function fromElement(element, options) {
      var data, isCached, isDecorated, raw, result = element;
      if (options && !CONTEXT_TYPES[options.nodeType]) {
        isCached    = options.cache;
        isDecorated = options.decorate;
      }
      if (raw = element.raw) {
        result = isDecorated === false ? raw : element;
      }
      else if (isDecorated !== false) {
        Decorator.prototype = getOrCreateTagClass(element.tagName).plugin;
        if (isCached === false) {
          result = new Decorator(element);
        } else {
          data = domData[getFuseId(element)];
          result = data.decorator || (data.decorator = new Decorator(element));
        }
      }
      return result;
    },

    fromHTML = function fromHTML(html, context) {
      // support `<div>` format
      var element, fragment, isCached, isDecorated, length, match, result;
      if (match = html.match(reSimpleTag)) {
        return fromTagName(match[1], context);
      }
      if (context && !CONTEXT_TYPES[context.nodeType]) {
        isCached    = context.cache;
        isDecorated = context.decorate;
        context     = context.context;
      }

      isCached    = isCached !== false;
      isDecorated = isDecorated !== false;
      fragment    = getFragmentFromHTML(html, context);
      length      = fragment.childNodes.length;

      // multiple elements return a NodeList
      if (length > 1) {
        result = NodeList();
        if (isDecorated) {
          while (length--) {
            element = fragment.removeChild(fragment.lastChild);
            Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
            if (isCached) {
              result[length] = domData[getFuseId(element)].decorator = new Decorator(element);
            } else {
              result[length] = new Decorator(element);
            }
          }
        } else {
          while (length--) {
            result[length] = fragment.removeChild(fragment.lastChild);
          }
        }
      }
      // single element return decorated element
      else {
        result = fragment.removeChild(fragment.firstChild);
        if (isDecorated) {
          element = result;
          Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
          result = new Decorator(element);

          if (isCached) {
            domData[getFuseId(element)].decorator = result;
          }
        }
      }
      return result;
    },

    fromId = function fromId(id, context) {
      var element, isCached, isDecorated;
      if (context && !CONTEXT_TYPES[context.nodeType]) {
        isCached    = context.cache;
        isDecorated = context.decorate;
        context     = context.context;
      }
      element = (context || doc).getElementById(id || uid);
      return isDecorated === false
        ? element
        : element && fromElement(element, isCached);
    },

    fromTagName = function fromTagName(tagName, context) {
      // support simple tagNames
      var attrs, element, isCached, isDecorated, nodes, result;
      if (context && !CONTEXT_TYPES[context.nodeType]) {
        isCached    = context.cache;
        isDecorated = context.decorate;
        context     = context.context;
      }

      // for a tidy cache stick to all upper or all lower case tagNames
      context || (context = doc);

      nodes = context === doc ? domData['1'].nodes :
        domData[getFuseId(getDocument(context))].nodes;

      result = (nodes[tagName] ||
        (nodes[tagName] = context.createElement(tagName))).cloneNode(false);

      if (isDecorated !== false) {
        element = result;
        Decorator.prototype = getOrCreateTagClass(tagName).plugin;
        result = new Decorator(element);
        if (isCached !== false) {
          domData[getFuseId(element)].decorator = result;
        }
      }
      return result;
    },

    getFragmentFromHTML = function getFragmentFromHTML(html, context, cache) {
      context || (context = doc);
      cache   || (cache = getFragmentCache(context.ownerDocument || context));

      var match, nodeName, tbody, times, wrapping, node = cache.node;
      if (html == '') {
        return cache.fragment;
      }
      if (context.nodeType == DOCUMENT_NODE && (match = html.match(reExtractTagName))) {
        nodeName = FROM_STRING_CHILDREN_PARENTS[match[1].toUpperCase()];
      }
      if (!nodeName) {
        nodeName = getNodeName(context);
      }
      // skip auto-inserted tbody
      if (nodeName == 'TABLE' && ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
          reStartsWithTR.test(html)) {
        nodeName = 'TBODY';
      }

      wrapping = FROM_STRING_PARENT_WRAPPERS[nodeName];

      // Fix IE rendering issue with innerHTML and script
      // and link elements by prefixing the html with text
      if (!wrapping && ELEMENT_INNERHTML_IGNORES_SCRIPTS && reTagStart.test(html)) {
        node.innerHTML = 'x' + html;
        node.removeChild(node.firstChild);
      }
      else if (wrapping) {
        times = wrapping[2];
        node.innerHTML= wrapping[0] + html + wrapping[1];
        while (times--) node = node.firstChild;
      }
      else {
        node.innerHTML = html;
      }

      // remove auto-inserted tbody
      if (nodeName == 'TABLE' && ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
          !reTBody.test(html) && (tbody = node.getElementsByTagName('tbody')[0])) {
        tbody.parentNode.removeChild(tbody);
      }
      return getFragmentFromChildNodes(node, cache);
    },

    getFragmentFromChildNodes = function(parentNode, cache) {
      var fragment = cache.fragment,
       nodes = parentNode.childNodes,
       length = nodes.length;
      while (length--) {
        fragment.insertBefore(nodes[length], fragment.firstChild);
      }
      return fragment;
    },

    getFragmentCache = function(ownerDoc) {
      var id = ownerDoc === doc ? '1' : getFuseId(ownerDoc),
       data = domData[id];
      return data._fragmentCache || (data._fragmentCache = {
        'node':     ownerDoc.createElement('div'),
        'fragment': ownerDoc.createDocumentFragment()
      });
    },

    fuse = function fuse(object, context) {
      var isCached, isDecorated;
      if (isString(object)) {
        return object.charAt(0) == '<'
          ? HTMLElement(object, context)
          : fromId(object, context);
      }
      if (context && !CONTEXT_TYPES[context.nodeType]) {
        isCached    = context.cache;
        isDecorated = context.decorate;
      }
      return isDecorated === false
        ? object
        : Node(Window(object, isCached), isCached);
    };


    // IE7 and below need to use the sTag of createElement to set the `name` attribute
    // http://msdn.microsoft.com/en-us/library/ms536389.aspx
    //
    // IE fails to set the BUTTON element's `type` attribute without using the sTag
    // http://dev.rubyonrails.org/ticket/10548
    if (envTest('NAME_ATTRIBUTE_IS_READONLY')) {
      var __HTMLElement = HTMLElement;
      HTMLElement = function HTMLElement(tagName, context) {
        var attrs, match, name, type;
        if (isString(tagName) && context &&
            !CONTEXT_TYPES[context.nodeType] && (attrs = context.attrs) &&
            ((name = attrs.name) || (type = attrs.type)) &&
            (tagName.charAt(0) != '<' || (match = tagName.match(reSimpleTag)))) {

          tagName = '<' + match[1] +
            (name ? ' name="' + name + '"' : '') +
            (type ? ' type="' + type + '"' : '') + '>';

          delete attrs.name; delete attrs.type;
          return plugin.setAttribute.call(fromHTML(tagName, context), attrs);
        }
        return __HTMLElement(tagName, context);
      };
    }

    if (envTest('ELEMENT_REMOVE_NODE')) {
      getFragmentFromChildNodes = function(parentNode, cache) {
        // removeNode: removes the parent but keeps the children
        var fragment = cache.fragment;
        fragment.appendChild(parentNode).removeNode();
        return fragment;
      };
    }

    // add class sugar to HTMLElement
    __fuse.Class(Element, { 'constructor': HTMLElement });

    // add class sugar to fuse
    __fuse.Class({ 'constructor': fuse });

    // copy old fuse properties to new window.fuse
    eachKey(__fuse, function(value, key) {
      if (hasKey(__fuse, key)) fuse[key] = value;
    });

    plugin = HTMLElement.plugin;

    // expose
    HTMLElement.fromElement = fromElement;
    HTMLElement.fromHTML    = fromHTML;
    HTMLElement.fromId      = fromId;
    HTMLElement.fromTagName = fromTagName;
    HTMLElement.from        = from;

    window.fuse = fuse;
    fuse.dom.HTMLElement = HTMLElement;
    fuse.dom.getFragmentFromHTML = getFragmentFromHTML;
  })();

  /*--------------------------------------------------------------------------*/

  // define private vars shared by primary closure

  HTMLElement = fuse.dom.HTMLElement;

  fromElement = HTMLElement.fromElement;

  extendByTag = 
  HTMLElement.extendByTag = function extendByTag(tagName, plugins, mixins, statics) {
    if (isArray(tagName)) {
      var i = -1;
      while (tagName[++i]) {
        extendByTag(tagName[i], plugins, mixins, statics);
      }
    } else {
      getOrCreateTagClass(tagName).extend(plugins, mixins, statics);
    }
  };

  getOrCreateTagClass = (function() {

    var reTagName = /^[A-Z0-9]+$/,

    TAG_NAME_CLASSES = (function() {
      var i, T = {
        'A':        'Anchor',
        'CAPTION':  'TableCaption',
        'COL':      'TableCol',
        'DEL':      'Mod',
        'DIR':      'Directory',
        'DL':       'DList',
        'H1':       'Heading',
        'IFRAME':   'IFrame',
        'IMG':      'Image',
        'INS':      'Mod',
        'FIELDSET': 'FieldSet',
        'FRAMESET': 'FrameSet',
        'OL':       'OList',
        'OPTGROUP': 'OptGroup',
        'P':        'Paragraph',
        'Q':        'Quote',
        'TBODY':    'TableSection',
        'TD':       'TableCell',
        'TEXTAREA': 'TextArea',
        'TR':       'TableRow',
        'UL':       'UList'
      };

      T['TH'] = T['TD'];
      T['COLGROUP'] = T['COL'];
      T['TFOOT'] = T['THEAD'] =  T['TBODY'];
      T['H2'] = T['H3'] = T['H4'] = T['H5'] = T['H6'] = T['H1'];

      for (i in T) {
        T[i] = T[i.toLowerCase()] = 'HTML' + T[i] + 'Element';
      }
      return T;
    })();

    return function(tagName) {
      var upperCased, TagClass,
       tagClassName = TAG_NAME_CLASSES[tagName];

      if (!tagClassName) {
        if (tagClassName = TAG_NAME_CLASSES[upperCased = tagName.toUpperCase()]) {
          TAG_NAME_CLASSES[tagName] = tagClassName;
        } else {
          tagClassName = 
          TAG_NAME_CLASSES[tagName] =
          TAG_NAME_CLASSES[upperCased] = 'HTML' +
            (reTagName.test(upperCased)
              ? capitalize(tagName.toLowerCase())
              : 'Unknown') + 'Element';
        }
      }
      if (!(TagClass = fuse.dom[tagClassName])) {
        TagClass =
        fuse.dom[tagClassName] = fuse.Class(HTMLElement, {
          'constructor': Function('fn',
            'function ' + tagClassName + '(element,options){' +
            'return element&&(element.raw?element:fn(element,options))' +
            '}return ' + tagClassName)(fromElement)
        });

        TagClass.addMixins = Node.addMixins;
        TagClass.addPlugins = Node.addPlugins;
        TagClass.updateGenerics = Node.updateGenerics;
      }
      return TagClass;
    };
  })();

  extendByTag('button');
  extendByTag('form');
  extendByTag('input');
  extendByTag('option');
  extendByTag('select');
  extendByTag('textarea');

  HTMLButtonElement   = fuse.dom.HTMLButtonElement;
  HTMLFormElement     = fuse.dom.HTMLFormElement;
  HTMLInputElement    = fuse.dom.HTMLInputElement;
  HTMLOptionElement   = fuse.dom.HTMLOptionElement;
  HTMLSelectElement   = fuse.dom.HTMLSelectElement;
  HTMLTextAreaElement = fuse.dom.HTMLTextAreaElement;
 
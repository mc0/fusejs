  /*----------------------------- ELEMENT: CREATE ----------------------------*/

  (function() {

    var getFragmentFromHTML, plugin,

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

    __fuse = global.fuse,

    Node   = __fuse.dom.Node,

    Window = __fuse.dom.Window,

    doc    = __fuse._doc,

    getFuseId = Node.getFuseId,

    reSimpleTag = /^<([A-Za-z0-9]+)\/?>$/,

    reExtractTagName = /^<([^> ]+)/,

    reStartsWithTableRow = /^<tr/i,

    Decorator = function(element) {
      this.raw = element;
      this.style = element.style;
      this.nodeType = ELEMENT_NODE;
      this.childNodes = element.childNodes;
      this.tagName = this.nodeName = element.nodeName;
      this.initialize && this.initialize();
    },

    Element = function Element(tagName, context) {
      var attrs, element, isCached, isDecorated, result;
      if (context && !CONTEXT_TYPES[context.nodeType]) {
        attrs       = context.attrs;
        isCached    = context.cache;
        isDecorated = context.decorate;
        context     = context.context;
      }
      if (isString(tagName)) {
        result = (tagName.charAt(0) == '<' ? fromHTML : fromTagName)(tagName, context);
      }
      else {
        result = tagName;
        if (isDecorated !== false) {
          element = result;
          tagName = getNodeName(element);
          Decorator.prototype = getOrCreateTagClass(tagName).plugin;
          result = new Decorator(element);
          if (isCached !== false) {
            domData[getFuseId(element)].decorator = result;
          }
        }
      }
      return attrs ? plugin.setAttribute.call(result, attrs) : result;
    },

    extendByTag = function extendByTag(tagName, plugins, mixins, statics) {
      if (isArray(tagName)) {
        var i = -1;
        while (tagName[++i]) {
          extendByTag(tagName[i], plugins, mixins, statics);
        }
      } else {
        getOrCreateTagClass(tagName).extend(plugins, mixins, statics);
      }
    },

    from = function from(element, context) {
      return global.fuse(element, context);
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
        attrs       = context.attrs;
        isCached    = context.cache;
        isDecorated = context.decorate;
        context     = context.context;
      }

      // for a tidy cache stick to all upper or all lower case tagNames
      context || (context = doc);

      nodes = context === doc ? domData['2'].nodes :
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

    getContextualFragment = function getContextualFragment(html, context) {
      context || (context = doc);
      var cache = getFragmentCache(context.ownerDocument || context),
       match = html.match(reExtractTagName),
       range = cache.range;

      if (html == '') {
        return cache.fragment;
      }
      if (!match || !FROM_STRING_CHILDREN_PARENTS[match[1].toUpperCase()]) {
        // Konqueror throws when trying to create a fragment from
        // incompatible markup such as table rows. Similar to IE's issue
        // with setting table's innerHTML.
        //
        // WebKit and KHTML throw when creating contextual fragments from
        // orphaned elements.
        try {
          range.selectNode(context.body || context.firstChild);
          return range.createContextualFragment(html);
        } catch (e) { }
      }
      return getDocumentFragment(html, context, cache);
    },

    getDocumentFragment = function getDocumentFragment(html, context, cache) {
      context || (context = doc);
      cache   || (cache = getFragmentCache(context.ownerDocument || context));

      var match, nodeName, times, wrapping, node = cache.node;
      if (html == '') {
        return cache.fragment;
      }

      if (match = html.match(reExtractTagName)) {
        nodeName = match[1].toUpperCase();
      }
      if (context.nodeType === DOCUMENT_NODE) {
        nodeName = FROM_STRING_CHILDREN_PARENTS[nodeName] || nodeName;
      } else {
        nodeName = getNodeName(context);
      }

      if (wrapping = FROM_STRING_PARENT_WRAPPERS[nodeName]) {
        times = wrapping[2];
        node.innerHTML= wrapping[0] + html + wrapping[1];
        while (times--) node = node.firstChild;
      } else {
        node.innerHTML = html;
      }

      // skip auto-inserted tbody
      if (ELEMENT_TABLE_INNERHTML_INSERTS_TBODY &&
          nodeName === 'TABLE' && reStartsWithTableRow.test(html)) {
        node = node.firstChild;
      }
      return getFragmentFromChildNodes(node, cache);
    },

    getFragmentFromChildNodes = function(parentNode, cache) {
      var fragment = cache.fragment,
       nodes = parentNode.childNodes,
       length = node.length;
      while (length--) {
        fragment.insertBefore(nodes[length], fragment.firstChild);
      }
      return fragment;
    },

    getFragmentCache = function(ownerDoc) {
      var id = ownerDoc === doc ? '2' : getFuseId(ownerDoc),
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
          ? fromHTML(object, context)
          : fromId(object);
      }
      if (context && !CONTEXT_TYPES[context.nodeType]) {
        isCached    = context.cache;
        isDecorated = context.decorate;
      }
      return isDecorated === false
        ? object
        : Node(Window(object, isCached), isCached);
    };
 
    /*------------------------------------------------------------------------*/

    // IE7 and below need to use the sTag of createElement to set the `name` attribute
    // http://msdn.microsoft.com/en-us/library/ms536389.aspx
    //
    // IE fails to set the BUTTON element's `type` attribute without using the sTag
    // http://dev.rubyonrails.org/ticket/10548

    if (envTest('NAME_ATTRIBUTE_IS_READONLY') &&
        envTest('CREATE_ELEMENT_WITH_HTML')) {
      var __Element = Element;
      Element = function Element(tagName, context) {
        var attrs, element, id, isCached, isDecorated, name, nodes, type, result = null;

        if (isString(tagName) && tagName.charAt(0) != '<' &&
            context && !CONTEXT_TYPES[context.nodeType] &&
            ((name = context.name) || (type = context.type))) {

          attrs       = context.attrs;
          isCached    = context.cache;
          isDecorated = context.decorate;
          context     = context.context || doc;

          id = context === doc ? '2' : getFuseId(getDocument(context));
          nodes = domData[id].nodes;

          tagName = '<' + tagName +
            (name ? ' name="' + name + '"' : '') +
            (type ? ' type="' + type + '"' : '') + '>';

          result =
            (nodes[tagName] ||
            (nodes[tagName] = context.createElement(tagName)))
            .cloneNode(false);

          if (isDecorated !== false) {
            element = result;
            Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
            result = new Decorator(element);

            if (isCached !== false) {
              domData[getFuseId(element)].decorator = result;
            }
          }
          delete attrs.name; delete attrs.type;
          return plugin.setAttribute.call(result, attrs);
        }
        return __Element(tagName, context);
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
    else if (envTest('DOCUMENT_RANGE')) {
      getFragmentFromChildNodes = function(parentNode, cache) {
        var range = cache.range;
        range.selectNodeContents(parentNode);
        return range.extractContents() || cache.fragment;
      };

      getFragmentCache = function(ownerDoc) {
        var id = ownerDoc === doc ? '2' : getFuseId(ownerDoc),
         data = domData[id];
        return data._fragmentCache || (data._fragmentCache = {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment(),
          'range':    ownerDoc.createRange()
        });
      };
    }

    if (envTest('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT')) {
      getFragmentFromHTML = getContextualFragment;
    } else {
      getFragmentFromHTML = getDocumentFragment;
    }

    // add class sugar to Element
    __fuse.Class(Node, { 'constructor': Element });

    // add class sugar to fuse
    __fuse.Class({ 'constructor': fuse });

    // copy old fuse properties to new global.fuse
    eachKey(__fuse, function(value, key) {
      if (hasKey(__fuse, key)) fuse[key] = value;
    });

    plugin = Element.plugin;

    // expose
    Element.extendByTag = extendByTag;
    Element.fromElement = fromElement;
    Element.fromHTML    = fromHTML;
    Element.fromId      = fromId;
    Element.fromTagName = fromTagName;
    Element.from        = from;

    global.fuse = fuse;
    fuse.dom.Element = Element;
    fuse.dom.getFragmentFromHTML = getFragmentFromHTML;
  })();

  /*--------------------------------------------------------------------------*/

  // define private vars shared by primary closure

  Element = fuse.dom.Element;

  fromElement = Element.fromElement;

  getOrCreateTagClass = (function() {

    var dom = fuse.dom,

    reTagName = /^[A-Z0-9]+$/,

    TAG_NAME_CLASSES = (function() {
      var T = {
        'A':        'AnchorElement',
        'CAPTION':  'TableCaptionElement',
        'COL':      'TableColElement',
        'DEL':      'ModElement',
        'DIR':      'DirectoryElement',
        'DL':       'DListElement',
        'H1':       'HeadingElement',
        'IFRAME':   'IFrameElement',
        'IMG':      'ImageElement',
        'INS':      'ModElement',
        'FIELDSET': 'FieldSetElement',
        'FRAMESET': 'FrameSetElement',
        'OL':       'OListElement',
        'OPTGROUP': 'OptGroupElement',
        'P':        'ParagraphElement',
        'Q':        'QuoteElement',
        'TBODY':    'TableSectionElement',
        'TD':       'TableCellElement',
        'TEXTAREA': 'TextAreaElement',
        'TR':       'TableRowElement',
        'UL':       'UListElement'
      };

      T['TH'] = T['TD'];
      T['COLGROUP'] = T['COL'];
      T['TFOOT'] = T['THEAD'] =  T['TBODY'];
      T['H2'] = T['H3'] = T['H4'] = T['H5'] = T['H6'] = T['H1'];
      return T;
    })();

    return function(tagName) {
      var upperCased, TagClass,
       tagClassName = TAG_NAME_CLASSES[tagName];

      if (!tagClassName) {
        upperCased = tagName.toUpperCase();
        tagClassName = TAG_NAME_CLASSES[upperCased];

        if (!tagClassName) {
          // camel-case name
          if (reTagName.test(upperCased)) {
            tagClassName =
            TAG_NAME_CLASSES[upperCased] = capitalize(tagName.toLowerCase()) + 'Element';
          } else {
            tagClassName = 'UnknownElement';
          }
        }
        TAG_NAME_CLASSES[tagName] = tagClassName;
      }
      if (!(TagClass = dom[tagClassName])) {
        TagClass =
        dom[tagClassName] = fuse.Class(Element, {
          'constructor': Function('fn',
            'function ' + tagClassName + '(element){' +
            'return element&&(element.raw?element:fn(element))' +
            '}return ' + tagClassName)(fromElement)
        });

        TagClass.addMixins = Element.addMixins;
        TagClass.addPlugins = Element.addPlugins;
        TagClass.updateGenerics = Element.updateGenerics;
      }
      return TagClass;
    };
  })();

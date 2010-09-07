  /*-------------------------- HTML ELEMENT: CREATE --------------------------*/

  (function() {

    var ELEMENT_INNER_HTML_IGNORES_SCRIPTS =
      envTest('ELEMENT_INNER_HTML_IGNORES_SCRIPTS'),

    ELEMENT_TABLE_INNER_HTML_INSERTS_TBODY =
      envTest('ELEMENT_TABLE_INNER_HTML_INSERTS_TBODY'),

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
      T.TH = T.TD;
      T.OPTGROUP = T.SELECT;
      T.TFOOT = T.THEAD = T.TBODY;
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

      T.TH = T.TD;
      T.OPTGROUP = T.OPTION;
      T.TFOOT = T.THEAD = T.TBODY;
      T.CAPTION = T.COLGROUP = T.TBODY;
      return T;
    })(),

    doc              = window.fuse._doc,
    reSimpleTag      = /^<([A-Za-z0-9]+)\/?>$/,
    reTagStart       = /^\s*</,
    reTBody          = /<tbody /i,
    reExtractTagName = /^<([^> ]+)/,
    reStartsWithTR   = /^<tr/i,

    HTMLElement = function HTMLElement(tagName, context) {
      var attrs, element, options, result;
      if (!tagName || tagName.raw) {
        return tagName;
      }
      if (tagName.nodeType) {
        result = fromElement(tagName, context);
      } else {
        result = (tagName.charAt(0) == '<' ? fromHTML : fromTagName)(tagName, context);
      }
      options = !CONTEXT_TYPES[context && context.nodeType] && context;
      return (attrs = options && options.attrs)
        ? Element.plugin.setAttribute.call(result, attrs)
        : result;
    };

    function Decorator(element) {
      this.raw = element;
      this.style = element.style;
      this.nodeType = ELEMENT_NODE;
      this.childNodes = element.childNodes;
      this.tagName = this.nodeName = element.nodeName;
      this.initialize && this.initialize();
    }

    function Element(tagName, context) {
      // pass to HTMLElement until we have a non-html element solution
      return HTMLElement(tagName, context);
    }

    function extendByTag(tagName, plugins, mixins, statics) {
      var i = -1;
      if (isArray(tagName)) {
        while (tagName[++i]) {
          extendByTag(tagName[i], plugins, mixins, statics);
        }
      } else {
        getOrCreateTagClass(tagName).extend(plugins, mixins, statics);
      }
    }

    function from(element, context) {
      return window.fuse(element, context);
    }

    function fromElement(element, options) {
      var data, isCached, isDecorated, raw, result = element;
      if (options && !CONTEXT_TYPES[options.nodeType]) {
        isCached = options.cache;
        isDecorated = options.decorate;
      }
      isDecorated = isDecorated == null || isDecorated;
      if (raw = element.raw) {
        result = isDecorated ? element : raw;
      }
      else if (isDecorated) {
        Decorator.prototype = getOrCreateTagClass(element.tagName).plugin;
        if (isCached == null || isCached) {
          data = domData[getFuseId(element)];
          result = data.decorator || (data.decorator = new Decorator(element));
        } else {
          result = new Decorator(element);
        }
      }
      return result;
    }

    function fromHTML(html, context) {
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

      isCached    = isCached == null || isCached;
      isDecorated = isDecorated == null || isDecorated;
      fragment    = getFragmentFromHTML(html, context);

      // multiple elements return a NodeList
      if (fragment.nodeType == DOCUMENT_FRAGMENT_NODE) {
        result = NodeList();
        length = fragment.childNodes.length;
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
        result = fragment.parentNode.removeChild(fragment);
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
    }

    function fromId(id, context) {
      var element, isCached, isDecorated;
      if (context && !CONTEXT_TYPES[context.nodeType]) {
        isCached    = context.cache;
        isDecorated = context.decorate;
        context     = context.context;
      }
      element = (context || doc).getElementById(id || uid);
      return isDecorated == null || isDecorated
        ? element && fromElement(element, isCached)
        : element;
    }

    function fromTagName(tagName, context) {
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

      if (isDecorated == null || isDecorated) {
        element = result;
        Decorator.prototype = getOrCreateTagClass(tagName).plugin;
        result = new Decorator(element);
        if (isCached == null || isCached) {
          domData[getFuseId(element)].decorator = result;
        }
      }
      return result;
    }

    function getFragmentFromHTML(html, context) {
      context || (context = doc);
      var match, node, nodeName, tbody, times, wrapping,
       ownerDoc = context.ownerDocument || context,
       data = domData[ownerDoc == doc ? '1': getFuseId(ownerDoc)],
       cache = data.fragments || (data.fragments = {
         'node': ownerDoc.createElement('div'),
         'fragment': ownerDoc.createDocumentFragment()
       });

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
      if (nodeName == 'TABLE' && ELEMENT_TABLE_INNER_HTML_INSERTS_TBODY &&
          reStartsWithTR.test(html)) {
        nodeName = 'TBODY';
      }

      node = cache.node;
      wrapping = FROM_STRING_PARENT_WRAPPERS[nodeName];

      // Fix IE rendering issue with innerHTML and script
      // and link elements by prefixing the html with text
      if (!wrapping && ELEMENT_INNER_HTML_IGNORES_SCRIPTS && reTagStart.test(html)) {
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

      // exit early for single elements
      if (node.childNodes.length == 1) {
        return node.firstChild;
      }
      // remove auto-inserted tbody
      if (nodeName == 'TABLE' && ELEMENT_TABLE_INNER_HTML_INSERTS_TBODY &&
          !reTBody.test(html) && (tbody = node.getElementsByTagName('tbody')[0])) {
        tbody.parentNode.removeChild(tbody);
      }
      return getFragmentFromChildNodes(node, cache);
    }

    function getFragmentFromChildNodes(parentNode, cache) {
      var fragment = cache.fragment,
       nodes = parentNode.childNodes, length = nodes.length;
      while (length--) {
        fragment.insertBefore(nodes[length], fragment.firstChild);
      }
      return fragment;
    }

    function fuse(object, context) {
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
      return isDecorated == null || isDecorated
        ? Node(Window(object, isCached), isCached)
        : object;
    }

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
        var fragment = cache.fragment;
        fragment.appendChild(parentNode).removeNode();
        return fragment;
      };
    }

    // copy old fuse properties to new window.fuse
    eachKey(window.fuse, function(value, key) {
      if (hasKey(window.fuse, key)) fuse[key] = value;
    });

    // add class sugar
    fuse.Class({ 'constructor': fuse });
    fuse.Class(Node, { 'constructor': Element });
    fuse.Class(Element, { 'constructor': HTMLElement });

    // expose
    Element.extendByTag =
    HTMLElement.extendByTag = extendByTag;

    Element.from =
    HTMLElement.from = from;

    Element.fromElement =
    HTMLElement.fromElement = fromElement;

    Element.fromId =
    HTMLElement.fromId = fromId;

    Element.fromTagName =
    HTMLElement.fromTagName = fromTagName;

    Element.fromHTML =
    HTMLElement.fromHTML = fromHTML;

    Element.updateGenerics =
    HTMLElement.updateGenerics = Node.updateGenerics;

    window.fuse = fuse;
    fuse.dom.Element = Element;
    fuse.dom.HTMLElement = HTMLElement;
    fuse.dom.getFragmentFromHTML = getFragmentFromHTML;
  })();

  /*--------------------------------------------------------------------------*/

  // define private vars shared by primary closure

  Element = fuse.dom.Element;

  HTMLElement = fuse.dom.HTMLElement;

  extendByTag = Element.extendByTag;

  fromElement = Element.fromElement;

  getFragmentFromHTML = fuse.dom.getFragmentFromHTML;

  getOrCreateTagClass = (function() {

    var TAG_NAME_CLASSES = (function() {
      var i, T = { }, temp = {
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

      temp.TH = temp.TD;
      temp.COLGROUP = temp.COL;
      temp.TFOOT = temp.THEAD =  temp.TBODY;
      temp.H2 = temp.H3 = temp.H4 = temp.H5 = temp.H6 = temp.H1;

      for (i in temp) {
       T[i] = T[i.toLowerCase()] = 'HTML' + temp[i] + 'Element';
      }
      return T;
    })(),

    reTagName = /^[A-Z0-9]+$/;

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

  HTMLFormElement = fuse.dom.HTMLFormElement;

  CONTROL_PLUGINS = {
    'BUTTON':   (HTMLButtonElement   = fuse.dom.HTMLButtonElement).plugin,
    'INPUT':    (HTMLInputElement    = fuse.dom.HTMLInputElement).plugin,
    'OPTION':   (HTMLOptionElement   = fuse.dom.HTMLOptionElement).plugin,
    'SELECT':   (HTMLSelectElement   = fuse.dom.HTMLSelectElement).plugin,
    'TEXTAREA': (HTMLTextAreaElement = fuse.dom.HTMLTextAreaElement).plugin
  };

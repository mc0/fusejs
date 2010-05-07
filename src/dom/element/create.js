  /*----------------------------- ELEMENT: CREATE ----------------------------*/

  (function() {

    var getFragmentFromString,

    ELEMENT_TABLE_INNERHTML_INSERTS_TBODY =
      envTest('ELEMENT_TABLE_INNERHTML_INSERTS_TBODY'),

    FROM_STRING_PARENT_WRAPPERS = (function() {
      var T = {
        'COLGROUP': ['<table><colgroup>',      '<\/colgroup><tbody><\/tbody><\/table>', 2],
        'SELECT':   ['<select>',               '<\/select>',                            1],
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
        'TD':     'TR',
        'TR':     'TBODY',
        'TBODY':  'TABLE',
        'OPTION': 'SELECT',
        'COL':    'COLGROUP'
      };

      T['TH'] = T['TD'];
      T['TFOOT'] = T['THEAD'] = T['TBODY'];
      return T;
    })(),

    getFuseId =  Node.getFuseId,

    reComplexTag = /^<([A-Za-z0-9]+)>$/,

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

    create = function create(tagName, attributes, context) {
      var clone, complexTag, decorated, element, fragment, id, isCached,
       length, nodes, result = null;

      // For speed we don't normalize tagName case.
      // There is the potential for cache.div, cache.DIV, cache['<div name="x">']
      // Please stick to either all uppercase or lowercase tagNames.
      //
      // IE7 and below need to use the sTag of createElement to set the `name` attribute
      // http://msdn.microsoft.com/en-us/library/ms536389.aspx
      //
      // IE fails to set the BUTTON element's `type` attribute without using the sTag
      // http://dev.rubyonrails.org/ticket/10548

      // caching html strings is not supported at the moment
      if (tagName.charAt(0) == '<') {
        // juggle arguments
        isCached = context;
        context  = attributes;

        // support `<div>x</div>` format tags
        if (!(complexTag = tagName.match(reComplexTag))) {
          fragment = getFragmentFromString(tagName, context);
          length = fragment.childNodes.length;

          // multiple elements return a NodeList
          if (length > 1) {
            result = NodeList();
            while (length--) {
              element = fragment.removeChild(fragment.lastChild);
              Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;

              decorated =
              result[length] = new Decorator(element);

              // cache if allowed
              if (isCached !== false) {
                domData[getFuseId(element)].decorator = decorated;
              }
            }
          }
          // single element return decorated element
          else {
            element = fragment.removeChild(fragment.firstChild);
            Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
            result = new Decorator(element);

            // cache if allowed
            if (isCached !== false) {
              domData[getFuseId(element)].decorator = result;
            }
          }
          return result;
        }

        // support `<div>` format tags
        tagName = complexTag[1];
      }

      context || (context = fuse._doc);
      id = context === fuse._doc ? '2' : getFuseId(getDocument(context));

      nodes = domData[id].nodes;
      clone = (nodes[tagName] ||
        (nodes[tagName] = context.createElement(tagName))).cloneNode(false);

      Decorator.prototype = getOrCreateTagClass(tagName).plugin;
      decorated = new Decorator(clone);

      // cache if allowed
      if ((attributes && attributes.cache) !== false) {
        domData[getFuseId(clone)].decorator = decorated;
      }

      return attributes
        ? decorated.setAttribute(attributes)
        : decorated;
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

    fromElement = function fromElement(element) {
      // quick return if decorated
      if (element.raw) return element;

      // return cached if available
      var id = getFuseId(element), data = domData[id];
      if (data.decorator) return data.decorator;

      Decorator.prototype = getOrCreateTagClass(element.tagName).plugin;
      return (data.decorator = new Decorator(element));
    },

    getById = function getById(id, context) {
      var element = (context || fuse._doc).getElementById(id || expando);
      return element && fromElement(element);
    },

    getContextualFragment = function getContextualFragment(html, context) {
      // Konqueror throws when trying to create a fragment from
      // incompatible markup such as table rows. Similar to IE's issue
      // with setting table's innerHTML.
      //
      // WebKit and KHTML throw when creating contextual fragments from
      // orphaned elements.
      try {
        context || (context = fuse._doc);
        var cache = getFragmentCache(context.ownerDocument || context),
         range = cache.range;
        range.selectNode(context.body || context.firstChild);
        return range.createContextualFragment(html);
      } catch (e) {
        return getDocumentFragment(html, context, cache);
      }
    },

    getDocumentFragment = function getDocumentFragment(html, context, cache) {
       context || (context = fuse._doc);
       cache || (cache = getFragmentCache(context.ownerDocument || context));

       var times, wrapping,
        node = cache.node,
        nodeName = context.nodeType === DOCUMENT_NODE
          ? FROM_STRING_CHILDREN_PARENTS[html.match(reExtractTagName)[1].toUpperCase()]
          : getNodeName(context);

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
      var id = ownerDoc === fuse._doc ? '2' : getFuseId(ownerDoc),
       data = domData[id];

      return data.fragmentCache || (data.fragmentCache = {
        'node':     ownerDoc.createElement('div'),
        'fragment': ownerDoc.createDocumentFragment()
      });
    };

    /*------------------------------------------------------------------------*/

    if (envTest('CREATE_ELEMENT_WITH_HTML')) {
      var __create = create;
      create = function create(tagName, attributes, context) {
        var clone, data, decorated, id, name, type;
        if (attributes && tagName.charAt(0) != '<' &&
           ((name = attributes.name) || (type = attributes.type))) {

          context || (context = fuse._doc);
          id = context === fuse._doc ? '2' : getFuseId(getDocument(context));
          data = domData[id].nodes;

          tagName = '<' + tagName +
            (name ? ' name="' + name + '"' : '') +
            (type ? ' type="' + type + '"' : '') + '>';

          clone =
            (data[tagName] ||
            (data[tagName] = context.createElement(tagName)))
            .cloneNode(false);

          Decorator.prototype = getOrCreateTagClass(clone.nodeName).plugin;
          decorated = new Decorator(clone);

          // may choose to avoid caching for performance/memory
          if (attributes.cache !== false) {
            domData[getFuseId(clone)].decorator = decorated;
          }
          delete attributes.name; delete attributes.type; delete attributes.cache;
          return decorated.setAttribute(attributes);
        }
        return __create(tagName, attributes, context);
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
        var id = ownerDoc === fuse._doc ? '2' : getFuseId(ownerDoc), data = domData[id];
        return data.fragmentCache || (data.fragmentCache = {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment(),
          'range':    ownerDoc.createRange()
        });
      };
    }

    if (envTest('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT')) {
      getFragmentFromString = getContextualFragment;
    } else {
      getFragmentFromString = getDocumentFragment;
    }

    // expose
    Element.create      = create;
    Element.extendByTag = extendByTag;
    Element.fromElement = fromElement;
    Element.from = function from(object, attributes, context) {
      return fuse(object, attributes, context);
    };

    fuse.getById = getById;
    fuse.dom.getFragmentFromString = getFragmentFromString;
    fuse.get = function get(object, attributes, context) {
      return fuse(object, attributes, context);
    };

    // prevent JScript bug with named function expressions
    var from = nil, get = nil;
  })();

  /*--------------------------------------------------------------------------*/

  global.fuse = (function(__fuse) {
    // micro-optimization
    var Node     = __fuse.dom.Node,
     Window      = __fuse.dom.Window,
     create      = Element.create,
     fromElement = Element.fromElement,

    fuse = function fuse(object, attributes, context) {
      if (isString(object)) {
        if (attributes && typeof attributes.nodeType !== 'string') {
          return create(object, attributes, context);
        }
        context = attributes;
        if (object.charAt(0) == '<') {
          return create(object, context);
        }
        object = (context || fuse._doc).getElementById(object || expando);
        return object && fromElement(object);
      }
      // attempt window decorator first, and then node decorator
      return Node(Window(object));
    };

    // copy old fuse properties to new global.fuse
    __fuse.Class({ 'constructor': fuse });
    eachKey(__fuse, function(value, key) {
      if (hasKey(__fuse, key)) fuse[key] = value;
    });

    return fuse;
  })(global.fuse);

  /*--------------------------------------------------------------------------*/

  // define private vars shared by primary closure

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
          if (reTagName.test(upperCased)) {
            // camel-cased name
            tagClassName =
            TAG_NAME_CLASSES[upperCased] =
              tagName.charAt(0).toUpperCase() +
              tagName.slice(1).toLowerCase()  +
              'Element';
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

  /*----------------------------- ELEMENT: CREATE ----------------------------*/

 (function() {

    var ELEMENT_TABLE_INNERHTML_INSERTS_TBODY =
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
    })(),

    doc = fuse._doc,

    dom = fuse.dom,

    getFuseId = Node.getFuseId,

    reComplexTag = /^<([A-Za-z]+)>$/,

    reStartsWithTableRow = /^<tr/i,

    reTagName= /^<([^> ]+)/,

    Decorator = function(element) {
      this.raw = element;
      this.style = element.style;
      this.nodeType = ELEMENT_NODE;
      this.childNodes = element.childNodes;
      this.tagName = this.nodeName = element.nodeName;
      this.initialize && this.initialize();
    },

    create = function create(tagName, attributes, context) {
      var clone, complexTag, data, decorated, element, fragment, id, isCached,
       length, result = null;

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
          fragment = dom.getFragmentFromString(tagName, context);
          length = fragment.childNodes.length;

          // multiple elements return a NodeList
          if (length > 1) {
            result = NodeList();
            while (length--) {
              element = fragment.removeChild(fragment.lastChild);
              Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;

              decorated =
              result[length] = new Decorator(element);

              // cache flag evaluation
              if (isCached !== false) {
                Data[getFuseId(element)].decorator = decorated;
              }
            }
          }
          // single element return decorated element
          else {
            element = fragment.removeChild(fragment.firstChild);
            Decorator.prototype = getOrCreateTagClass(element.nodeName).plugin;
            result = new Decorator(element);

            // cache flag evaluation
            if (isCached !== false) {
              Data[getFuseId(element)].decorator = result;
            }
          }
          return result;
        }

        // support `<div>` format tags
        tagName = complexTag[1];
      }

      context || (context = doc);
      id = context === doc ? '2' : getFuseId(getDocument(context));
      data = Data[id].nodes;
      clone =
        (data[tagName] ||
        (data[tagName] = context.createElement(tagName)))
        .cloneNode(false);

      // avoid adding the new element to the data cache
      Decorator.prototype = getOrCreateTagClass(clone.nodeName).plugin;
      decorated = new Decorator(clone);

      // cache flag evaluation
      if ((attributes && attributes.cache) !== false) {
        Data[getFuseId(clone)].decorator = decorated;
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
      var id = getFuseId(element), data = Data[id];
      if (data.decorator) return data.decorator;

      Decorator.prototype = getOrCreateTagClass(element.tagName).plugin;
      return (data.decorator = new Decorator(element));
    },

    getContextualFragment = function getContextualFragment(html, context) {
      // Konqueror throws when trying to create a fragment from
      // incompatible markup such as table rows. Similar to IE's issue
      // with setting table's innerHTML.

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
          ? FROM_STRING_CHILDREN_PARENTS[html.match(reTagName)[1].toUpperCase()]
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

    getOrCreateTagClass = function(tagName) {
      var upperCased, tagClass, tagClassName = TAG_NAME_CLASSES[tagName];
      if (!tagClassName) {
        upperCased = tagName.toUpperCase();
        tagClassName = TAG_NAME_CLASSES[upperCased];

        if (!tagClassName) {
          TAG_NAME_CLASSES[upperCased] =
          tagClassName = capitalize.call(tagName) + 'Element';
        }
        TAG_NAME_CLASSES[tagName] = tagClassName;
      }

      if (!(tagClass = dom[tagClassName])) {
        (tagClass =
        dom[tagClassName] = Class(Element, function() {
          return {
            'constructor': Function('fn',
              'function ' + tagClassName + '(element){' +
              'return element&&(element.raw?element:fn(element))' +
              '}return ' + tagClassName)(fromElement)
          };
        })).updateGenerics = Node.updateGenerics;
      }
      return tagClass;
    },

    getFragmentCache = function(ownerDoc) {
      var id = ownerDoc === doc ? '2' : getFuseId(ownerDoc), data = Data[id];
      return data.fragmentCache || (data.fragmentCache = {
        'node':     ownerDoc.createElement('div'),
        'fragment': ownerDoc.createDocumentFragment()
      });
    };

    if (envTest('CREATE_ELEMENT_WITH_HTML')) {
      create = (function(__create) {
        function create(tagName, attributes, context) {
          var clone, data, decorated, id, name, type;
          if (attributes && tagName.charAt(0) != '<' &&
             ((name = attributes.name) || (type = attributes.type))) {

            context || (context = doc);
            id = context === doc ? '2' : getFuseId(getDocument(context));
            data = Data[id].nodes;

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
              Data[getFuseId(clone)].decorator = decorated;
            }

            delete attributes.name; delete attributes.type; delete attributes.cache;
            return decorated.setAttribute(attributes);
          }
          return __create(tagName, attributes, context);
        }

        return create;
      })(create);
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
        var id = ownerDoc === doc ? '2' : getFuseId(ownerDoc), data = Data[id];
        return data.fragmentCache || (data.fragmentCache = {
          'node':     ownerDoc.createElement('div'),
          'fragment': ownerDoc.createDocumentFragment(),
          'range':    ownerDoc.createRange()
        });
      };
    }

    // exposed API
    Element.create      = create;
    Element.from        = fuse.get;
    Element.fromElement = fromElement;
    Element.extendByTag = extendByTag;

    dom.getFragmentFromString =
      envTest('DOCUMENT_RANGE_CREATE_CONTEXTUAL_FRAGMENT')
      ? getContextualFragment
      : getDocumentFragment;
  })();

  // private alias
  fromElement = Element.fromElement;

  /*-------------------------- ELEMENT: MODIFICATION -------------------------*/

  (function(plugin) {

    var TREAT_AS_STRING = { '[object Number]': 1, '[object String]': 1 },

    CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 },

    PROPS_TO_COPY = { 'OPTION': 'selected', 'TEXTAREA': 'value' },

    DEFAULTS_TO_COPY = { 'selected': 'defaultSelected', 'value': 'defaultValue' },

    INSERTABLE_NODE_TYPES = { '1': 1, '3': 1, '8': 1, '10': 1, '11': 1 },

    INSERT_POSITIONS_TO_METHODS = {
      'before': 'insertBefore',
      'top':    'prepend',
      'bottom': 'append',
      'after':  'insertAfter'
    },

    ELEMENT_INNERHTML_BUGGY = (function() {
      var T = false, o = { };
      if (envTest('ELEMENT_COLGROUP_INNERHTML_BUGGY')) {
        (T = T || o).COLGROUP = 1;
      }
      if (envTest('ELEMENT_OPTGROUP_INNERHTML_BUGGY')) {
        (T = T || o).OPTGROUP = 1;
      }
      if (envTest('ELEMENT_SELECT_INNERHTML_BUGGY')) {
        (T = T || o).SELECT = 1;
      }
      if (envTest('ELEMENT_TABLE_INNERHTML_BUGGY')) {
        (T = T || o).TABLE = T.TBODY = T.TR = T.TD = T.TFOOT = T.TH = T.THEAD = 1;
      }
      return T;
    })(),

    ELEMENT_INSERT_METHODS = {
      'before': function(element, node, parentNode) {
        parentNode.insertBefore(node, element);
      },

      'top': function(element, node) {
        element.insertBefore(node, element.firstChild);
      },

      'bottom': function(element, node) {
        element.appendChild(node);
      },

      'after': function(element, node, parentNode) {
         parentNode.insertBefore(node, element.nextSibling);
      }
    },

    stripScripts    = fuse.String.plugin.stripScripts,

    evalScripts     = fuse.String.plugin.evalScripts,

    isScriptable    = stripScripts && evalScripts,

    reOpenScriptTag = /<script/i,

    rePositions     = /^(?:(?:before|top|bottom|after)(?:,|$))+$/i,

    toHTML          = fuse.Object.toHTML,

    getFragmentFromHTML = fuse.dom.getFragmentFromHTML,

    getByTagName = function(node, tagName) {
      var result = [], child = node.firstChild;
      while (child) {
        if (getNodeName(child) === tagName) {
          result.push(child);
        }
        else if (child.getElementsByTagName) {
          // concatList implementation for nodeLists
          var i = 0, pad = result.length, nodes = child.getElementsByTagName(tagName);
          while (result[pad + i] = nodes[i++]) { }
          result.length--;
        }
        child = child.nextSibling;
      }
      return result;
    },

    cloneNode = function(source) {
      return source.cloneNode(false);
    },

    createCloner = function() {
      return function(source, deep, isData, isEvents, excludes, context) {
        var addDispatcher, data, id, length, node, nodes, srcData, srcEvents, i = -1, 
         element = cloneNode(source, excludes, null, context);

        if (excludes) {
          length = excludes.length;
          while (length--) {
            plugin.removeAttribute.call(element, excludes[length]);
          }
        }

        if (isData || isEvents) {
          srcData = domData[getFuseId(source, true)];
          srcEvents = srcData && srcData.events;

          if (srcData && isData) {
            id || (id = getFuseId(element));
            data = domData[id];

            delete srcData.events;
            fuse.Object.extend(data, srcData);
            srcEvents && (srcData.events = srcEvents);
          }
          if (srcEvents && isEvents) {
            id   || (id = getFuseId(element));
            data || (data = domData[id]);

            // copy delegation watcher
            if (srcData._isWatchingDelegation) {
              fuse.dom.Event._addWatcher(element, data);
            }
            // copy events
            addDispatcher = fuse.dom.Event._addDispatcher;
            eachKey(srcEvents, function(ec, type) {
              addDispatcher(element, type, null, id);
              data.events[type].handlers = ec.handlers.slice(0);
            });
          }
        }

  		  if (deep) {
  		    cloner = createCloner();
  		    nodes  = source.childNodes;
    		  while (node = nodes[++i]) {
    	      element.appendChild(node.nodeType === ELEMENT_NODE
    	        ? cloner(node, deep, isData, isEvents, excludes, context)
    	        : node.cloneNode(false));
    		  }
  		  }
  			return element;
      };
    },

    cloner = createCloner(),

    insertContent = function(element, parentNode, content, position) {
      var stripped, insertElement = ELEMENT_INSERT_METHODS[position],
       classOf = toString.call(content);

      // process string / number
      if (TREAT_AS_STRING[classOf]) {
        if (isScriptable && reOpenScriptTag.test(content)) {
          stripped = stripScripts.call(content);
        } else {
          stripped = classOf !== '[object String]' ? String(content) : content;
        }
        if (stripped) {
          insertElement(element,
            getFragmentFromHTML(stripped, parentNode || element),
            parentNode);
        }
        // only evalScripts if there are scripts
        if (content != stripped) {
          setTimeout(function() { evalScripts.call(content); }, 10);
        }
      }
      // process object
      else if (content) {
        // process toHTML
        if (typeof content.toHTML === 'function') {
          return insertContent(element, parentNode, toHTML(content), position);
        }
        // process toElement
        if (typeof content.toElement === 'function') {
          content = content.toElement();
        }
        // process element
        if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          insertElement(element, content.raw || content, parentNode);
        }
      }
    },

    replaceElement = function(element, node) {
      element.parentNode.replaceChild(node, element);
    },

    setScriptText = (function() {
      if (envTest('ELEMENT_SCRIPT_HAS_TEXT_PROPERTY')) {
        return function(element, text) {
          element.text = text || '';
        };
      }
      return function(element, text) {
        var textNode = element.firstChild ||
          element.appendChild(element.ownerDocument.createTextNode(''));
        textNode.data = text || '';
      };
    })(),

    wrapper = function(method, element, node) {
      method(element, node);

      var textNode, i = -1, scripts = [];
      if (INSERTABLE_NODE_TYPES[node.nodeType]) {
        if (getNodeName(node) === 'SCRIPT') {
          scripts = [node];
        }
        else if (node.getElementsByTagName) {
          scripts = node.getElementsByTagName('SCRIPT');
        }
        else {
          // document fragments don't have GEBTN
          scripts = getByTagName(node, 'SCRIPT');
        }
      }
      while (script = scripts[++i]) {
        setScriptText(script, (textNode = script.firstChild) && textNode.data);
      }
    };

    /*------------------------------------------------------------------------*/

    plugin.cleanWhitespace = function cleanWhitespace() {
      // removes whitespace-only text node children
      var nextNode, element = this.raw || this,
       node = element.firstChild;

      while (node) {
        nextNode = node.nextSibling;
        if (node.nodeType === TEXT_NODE && !/\S/.test(node.nodeValue)) {
          element.removeChild(node);
        }
        node = nextNode;
      }
      return this;
    };

    plugin.clone = function clone(deep) {
      var context, excludes, element = this.raw || this;
      if (deep && typeof deep === 'object') {
        excludes = deep.excludes;
        context  = deep.context || getDocument(element);
        if (excludes && !isArray(excludes)) {
          excludes = [excludes];
        }
        result = cloner(element, deep.deep, deep.data, deep.events, excludes, context);
      } else {
        result = cloner(element, deep, null, null, null, getDocument(element));
      }
      return fromElement(result);
    };

    plugin.insertBefore = function insertBefore(content) {
      var element = this.raw || this, parentNode = element.parentNode;
      parentNode && insertContent(element, parentNode, content, 'before');
      return this;
    };

    plugin.insertAfter = function insertAfter(content) {
      var element = this.raw || this, parentNode = element.parentNode;
      parentNode && insertContent(element, parentNode, content, 'after');
      return this;
    };

    plugin.prepend = function prepend(content) {
      var element = this.raw || this;
      insertContent(element, null, content, 'top');
      return this;
    };

    plugin.append = function append(content) {
      var element = this.raw || this;
      insertContent(element, null, content, 'bottom');
      return this;
    };

    plugin.insert = function insert(insertions) {
      var content, defaultPosition, nodeType, position;
      if (insertions) {
        if (isHash(insertions)) {
          insertions = insertions._object;
        }
        content = insertions.raw || insertions;
        defaultPosition = { 'bottom': content };
        if (nodeType = content.nodeType) {
          if (INSERTABLE_NODE_TYPES[nodeType]) {
            insertions = defaultPosition;
          }
        } else if (typeof content !== 'object') {
          insertions = defaultPosition;
        } else if (!rePositions.test(fuse.Object.keys(content))) {
          insertions = defaultPosition;
        }
      }

      for (position in insertions) {
        plugin[INSERT_POSITIONS_TO_METHODS[position.toLowerCase()]]
          .call(this, insertions[position]);
      }
      return this;
    };

    plugin.remove = function remove() {
      var element = this.raw || this;
      element.parentNode &&
        element.parentNode.removeChild(element);
      return this;
    };

    plugin.replace = function replace(content) {
      var html, stripped, element = this.raw || this,
       classOf = toString.call(content);

      // process string / number
      if (TREAT_AS_STRING[classOf]) {
        if (isScriptable && reOpenScriptTag.test(content)) {
          stripped = stripScripts.call(content);
        } else {
          stripped = classOf !== '[object String]' ? String(content) : content;
        }
        html = content;
        content = getFragmentFromHTML(stripped, element.parentNode);
        if (html != stripped) {
          setTimeout(function() { evalScripts.call(html); }, 10);
        }
      }
      // process object
      else if (content) {
        // process toHTML
        if (typeof content.toHTML === 'function') {
          return plugin.replace.call(this, toHTML(content));
        }
        // process toElement
        if (typeof content.toElement === 'function') {
          content = content.toElement();
        }
      }
      // replace with content
      if (INSERTABLE_NODE_TYPES[content && content.nodeType]) {
        replaceElement(element, content.raw || content);
      } else {
        plugin.remove.call(element);
      }
      return this;
    };

    plugin.update = function update(content) {
      var stripped, element = this.raw || this;

      if (getNodeName(element) === 'SCRIPT') {
        setScriptText(element, content);
      }
      // process string / number
      else if (TREAT_AS_STRING[toString.call(content)]) {
        if (isScriptable && reOpenScriptTag.test(content)) {
          element.innerHTML =
          stripped = stripScripts.call(content);
          if (content != stripped) {
            setTimeout(function() { evalScripts.call(content); }, 10);
          }
        } else {
          element.innerHTML = content;
        }
      }
      // process object
      else if (content) {
        // process toHTML
        if (typeof content.toHTML === 'function') {
          return plugin.update.call(this, toHTML(content));
        }
        // process toElement
        if (typeof content.toElement === 'function') {
          content = content.toElement();
        }
        // process element
        if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          element.innerHTML = '';
          element.appendChild(content.raw || content);
        }
      } else {
        element.innerHTML = '';
      }
      return this;
    };

    plugin.wrap = function wrap(wrapper, attributes) {
      var rawWrapper, element = this.raw || this;
      if (isString(wrapper)) {
        wrapper = Element(wrapper, { 'attrs': attributes, 'context': element });
      }
      if (isElement(wrapper)) {
        wrapper = plugin.setAttribute.call(wrapper, attributes);
      }
      else {
        wrapper = Element('div', { 'attrs': wrapper, 'context': element });
      }
      rawWrapper = wrapper.raw || wrapper;
      if (element.parentNode) {
        element.parentNode.replaceChild(rawWrapper, element);
      }
      rawWrapper.appendChild(element);
      return wrapper;
    };

    /*------------------------------------------------------------------------*/

    // Optimized for IE/Opera
    if (envTest('ELEMENT_REMOVE_NODE')) {
      plugin.remove = function remove() {
        (this.raw || this).removeNode(true);
        return this;
      };
    }

    // Fix inserting script elements in Safari <= 2.0.2 and Firefox 2.0.0.2
    if (envTest('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT')) {
      var __replaceElement = replaceElement;
      replaceElement = function(element, node) {
        wrapper(__replaceElement, element, node);
      };

      var __setScriptText = setScriptText;
      setScriptText = function(element, text) {
        __setScriptText(element, text);
        global.eval(element.firstChild.data);
      };

      (function(T) {
        var before = T.before, top = T.top, bottom = T.bottom, after = T.after;
        T.after  = function(e, n, p) { wrapper(after,  e, n, p); };
        T.before = function(e, n, p) { wrapper(before, e, n, p); };
        T.top    = function(e, n) { wrapper(top,    e, n); };
        T.bottom = function(e, n) { wrapper(bottom, e, n); };
      })(ELEMENT_INSERT_METHODS);
    }

    // Fix browsers with buggy innerHTML implementations
    if (ELEMENT_INNERHTML_BUGGY) {
      plugin.update = function update(content) {
        var classOf, isBuggy, stripped, element  = this.raw || this,
         nodeName = getNodeName(element);

        // update script elements
        if (nodeName === 'SCRIPT') {
          setScriptText(element, content);
          return this;
        }
        // remove children manually when innerHTML can't be used
        if (isBuggy = ELEMENT_INNERHTML_BUGGY[nodeName]) {
          while (element.lastChild) {
            element.removeChild(element.lastChild);
          }
        }
        // process string / number
        classOf = toString.call(content);
        if (TREAT_AS_STRING[classOf]) {
          if (isScriptable && reOpenScriptTag.test(content)) {
            stripped = stripScripts.call(content);
          } else {
            stripped = classOf !== '[object String]' ? String(content) : content;
          }
          if (isBuggy) {
            if (stripped) {
              element.appendChild(getFragmentFromHTML(stripped, element));
            }
          } else {
            element.innerHTML = stripped;
          }

          if (content != stripped) {
            setTimeout(function() { evalScripts.call(content); }, 10);
          }
        }
        // process object
        else if (content) {
          // process toHTML
          if (typeof content.toHTML === 'function') {
            return plugin.update.call(this, toHTML(content));
          }
          // process toElement
          if (typeof content.toElement === 'function') {
            content = content.toElement();
          }
          // process element
          if (INSERTABLE_NODE_TYPES[content.nodeType]) {
            if (!isBuggy) element.innerHTML = '';
            element.appendChild(content.raw || content);
          }
        } else if (!isBuggy) {
          element.innerHTML = '';
        }
        return this;
      };
    }

    // Fix cloning elements in IE 6/7
    if (envTest('ELEMENT_MERGE_ATTRIBUTES') &&
       (envTest('ATTRIBUTE_NODES_SHARED_ON_CLONED_ELEMENTS') ||
        envTest('NAME_ATTRIBUTE_IS_READONLY'))) {

      cloneNode = function(source, excludes, nodeName, context) {
        var attributes = { }, setName = 1, setType = 1;
        nodeName || (nodeName = getNodeName(source));
        if (excludes) {
          excludes = ' ' + excludes.join(' ') + ' ';
          setName = excludes.indexOf(' name ') === -1;
          setType = excludes.indexOf(' type ') === -1;
        }
        if (typeof source.submit === 'undefined') {
          if (setName) attributes.name = source.name;
          if (setType) attributes.type = source.type;
        } else {
          if (setName) attributes.name = plugin.getAttribute.call(source, 'name');
          if (setType) attributes.type = plugin.getAttribute.call(source, 'type');
        }
        element = Element(nodeName, { 'attrs': attributes, 'context': context, 'decorate': false });
        element.mergeAttributes(source);
        return element;
      };
    }

    // Fix form element attributes in IE
    if (envTest('INPUT_VALUE_PROPERTY_SETS_ATTRIBUTE')) {
      var __cloneNode = cloneNode;
      cloneNode = function(source, excludes, nodeName, context) {
        nodeName || (nodeName = getNodeName(source));
        var defaultProp, element = __cloneNode(source, excludes, nodeName, context);

        // copy troublesome attributes/properties
        excludes = excludes && ' ' + excludes.join(' ') + ' ' || '';
  		  if (nodeName === 'INPUT') {
  		    if (excludes.indexOf(' value ') === -1) {
  		      element.defaultValue = source.defaultValue;
  		      element.value = source.value;
  		    }
  		    if (CHECKED_INPUT_TYPES[element.type] &&
  		        excludes.indexOf(' checked ') === -1) {
  		      element.defaultChecked = source.defaultChecked;
  		      element.checked = source.checked;
  		    }
  		  }
  		  else if (prop = PROPS_TO_COPY[nodeName] &&
  		      excludes.indexOf(' ' + prop + ' ') === -1) {
		      defaultProp = DEFAULTS_TO_COPY[prop];
		      element[defaultProp]  = source[defaultProp];
		      element[prop] = source[prop];
  		  }
  		  return element;
      };
    }

    // prevent JScript bug with named function expressions
    var append =       null,
     cleanWhitespace = null,
     clone =           null,
     insert =          null,
     insertAfter =     null,
     insertBefore =    null,
     prepend =         null,
     remove =          null,
     replace =         null,
     wrap =            null;
  })(Element.plugin);

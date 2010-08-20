  /*-------------------------- ELEMENT: MODIFICATION -------------------------*/

  (function(plugin) {

    var scripts,

    TREAT_AS_STRING = { '[object Number]': 1, '[object String]': 1 },

    CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 },

    PARENT_NODE_AS_CONTEXT = { 'appendSibling': 1, 'prependSibling': 1 },

    PROPS_TO_COPY = { 'OPTION': 'selected', 'TEXTAREA': 'value' },

    DEFAULTS_TO_COPY = { 'selected': 'defaultSelected', 'value': 'defaultValue' },

    INSERTABLE_NODE_TYPES = { '1': 1, '3': 1, '8': 1, '10': 1, '11': 1 },

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

    getFragmentFromHTML = fuse.dom.getFragmentFromHTML,

    getByTagName = function(node, tagName) {
      var result = [], child = node.firstChild, upper = tagName.toUpperCase();
      while (child) {
        if (getNodeName(child) == upper) {
          result.push(child);
        }
        else if (typeof child.getElementsByTagName != 'undefined') {
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
    	      element.appendChild(node.nodeType == ELEMENT_NODE
    	        ? cloner(node, deep, isData, isEvents, excludes, context)
    	        : node.cloneNode(false));
    		  }
  		  }
  			return element;
      };
    },

    getScriptText = function(element) {
      if (element.childNodes.length > 1) {
        element.normalize();
      }
      return element.firstChild && element.firstChild.data || '';
    },

    setScriptText = function(element, text) {
      (element.firstChild ||
       element.appendChild(element.ownerDocument.createTextNode('')))
       .data = text == null ? '' : text;
    },

    getScripts = function(element) {
      return getNodeName(element) == 'SCRIPT' ? [element] : getByTagName(element, 'script');
    },

    runScripts = function(element) {
      var context, isAttached, script, i = -1;
      if (scripts) {
        isAttached = !plugin.isDetached.call(element);
        while (script = scripts[++i]) {
          if (!script.type || script.type.toLowerCase() == 'text/javascript') {
            isAttached && fuse.run(getScriptText(script), context || (context = getWindow(element)));
          }
        }
      }
    },

    toNode = function(content, context, classOf) {
      var result;
      classOf || (classOf = toString.call(content));
      if (scripts = TREAT_AS_STRING[classOf]) {
        result = getFragmentFromHTML(classOf == '[object String]' ? content : String(content), context);
      } else {
        result = content && content.raw || content || { };
      }
      if (INSERTABLE_NODE_TYPES[result.nodeType]) {
        scripts = getScripts(result);
        return result;
      }
    },

    cloner = createCloner();

    if (envTest('ELEMENT_SCRIPT_HAS_TEXT_PROPERTY')) {
      getScriptText = function(element) {
        return element.text;
      };
      setScriptText = function(element, text) {
        element.text = text || '';
      };
    }

    /*------------------------------------------------------------------------*/

    plugin.cleanWhitespace = function cleanWhitespace() {
      // removes whitespace-only text node children
      var nextNode, element = this.raw || this,
       node = element.firstChild;

      while (node) {
        nextNode = node.nextSibling;
        if (node.nodeType == TEXT_NODE && node.data == false) {
          element.removeChild(node);
        }
        node = nextNode;
      }
      return this;
    };

    plugin.clone = function clone(deep) {
      var context, excludes, element = this.raw || this;
      if (deep && typeof deep == 'object') {
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

    plugin.prependChildTo = function prependChildTo(content) {
      fuse(content).prependChild(this);
      return this;
    };

    plugin.appendChildTo = function appendChildTo(content) {
      fuse(content).appendChild(this);
      return this;
    };

    plugin.prependSiblingTo = function prependSiblingTo(content) {
      fuse(content).prependSibling(this);
      return this;
    };

    plugin.appendSiblingTo = function appendSiblingTo(content) {
      fuse(content).appendSibling(this);
      return this;
    };

    plugin.prependSibling = function prependSibling(content) {
      var element = this.raw || this, parentNode = element[PARENT_NODE];
      if (parentNode && (content = toNode(content, parentNode))) {
        parentNode.insertBefore(content, element);
        runScripts(element);
      }
      return this;
    };

    plugin.appendSibling = function appendSibling(content) {
      var element = this.raw || this, parentNode = element[PARENT_NODE];
      if (parentNode && (content = toNode(content, parentNode))) {
        parentNode.insertBefore(content, element.nextSibling);
        runScripts(element);
      }
      return this;
    };

    plugin.prependChild = function prependChild(content) {
      var element = this.raw || this;
      if (content = toNode(content, element)) {
        element.insertBefore(content, element.firstChild);
        //runScripts(element);
      }
      return this;
    };

    plugin.appendChild = function appendChild(content) {
      var element = this.raw || this;
      if (content = toNode(content, element)) {
        element.appendChild(content);
        runScripts(element);
      }
      return this;
    };

    plugin.remove = function remove() {
      var element = this.raw || this, parentNode = element[PARENT_NODE];
      parentNode && parentNode.removeChild(element);
      return this;
    };

    plugin.replace = function replace(content) {
      var element = this.raw || this, parentNode = element[PARENT_NODE];
      if (parentNode) {
        if (content = toNode(content, parentNode)) {
          parentNode.replaceChild(content, element);
          runScripts(parentNode);
        } else {
          plugin.remove.call(element);
        }
      }
      return this;
    };

    plugin.update = function update(content) {
      var element = this.raw || this;
      if (content == null) {
        content = '';
      }
      if (getNodeName(element) == 'SCRIPT') {
        setScriptText(element, content.nodeType == TEXT_NODE ?
          (content.raw || content).data : content);
        scripts = [element];
        runScripts(element);
      }
      else {
        if (TREAT_AS_STRING[toString.call(content)]) {
          element.innerHTML = content;
          scripts = getScripts(element);
          runScripts(element);
        }
        else if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          element.innerHTML = '';
          element.appendChild(content.raw || content);
        }
      }
      return this;
    };

    plugin.wrap = function wrap(wrapper, attributes) {
      var rawWrapper, element = this.raw || this, parentNode = element[PARENT_NODE];
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
      if (parentNode) {
        parentNode.replaceChild(rawWrapper, element);
      }
      rawWrapper.appendChild(element);
      return wrapper;
    };

    /*------------------------------------------------------------------------*/

    // Fix inserting script elements in Safari <= 2.0.2 and Firefox 2.0.0.2
    if (envTest('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT')) {
      var __replace = plugin.replace;
      plugin.replace = function replace(content) {
        var result = __replace.call(this, content);
        if (INSERTABLE_NODE_TYPES[content && content.nodeType]) {
          runScripts(result);
        }
        return result;
      };

      var __methods = 'prependSiblings,appendSiblings,prependChild,appendChild'.split(',');
      do {
        (function(method) {
          var fn = plugin[method];
          plugin[method] = function(content) {
            var element = this.raw || this,
             context = PARENT_NODE_AS_CONTEXT[method] ? element[PARENT_NODE] : element;
            if (context && (content = toNode(content, context))) {
              fn.call(element, content);
              runScripts(element);
            }
            return this;
          };
        })(__methods.shift());
      } while (__methods.length);
    }

    // Fix browsers with buggy innerHTML implementations
    if (ELEMENT_INNERHTML_BUGGY) {
      var __update = plugin.update;
      plugin.update = function update(content) {
        var classOf, element = this.raw || this, nodeName = getNodeName(element);
        if (ELEMENT_INNERHTML_BUGGY[nodeName]) {
          classOf = toString.call(content);
          while (element.lastChild) {
            element.removeChild(element.lastChild);
          }
          if (TREAT_AS_STRING[classOf] &&
              (content = toNode(content, element, classOf))) {
            element.appendChild(content);
            runScripts(element);
          }
          else if (INSERTABLE_NODE_TYPES[content && content.nodeType]) {
            element.appendChild(content.raw || content);
          }
        } else {
          __update.call(this, content);
        }
        return this;
      };
    }

    // Fix cloning elements in IE 6/7
    if (envTest('NAME_ATTRIBUTE_IS_READONLY') ||
        envTest('ATTRIBUTE_NODES_SHARED_ON_CLONED_ELEMENTS')) {

      cloneNode = function(source, excludes, nodeName, context) {
        var attr, node, attributes = { }, setName = 1, setType = 1;
        nodeName || (nodeName = getNodeName(source));

        if (excludes) {
          excludes = ' ' + excludes.join(' ') + ' ';
          setName = excludes.indexOf(' name ') == -1;
          setType = excludes.indexOf(' type ') == -1;
        }
        if (typeof source.submit == 'undefined') {
          if (setName) attributes.name = source.name;
          if (setType) attributes.type = source.type;
        } else {
          if (setName) attributes.name = plugin.getAttribute.call(source, 'name');
          if (setType) attributes.type = plugin.getAttribute.call(source, 'type');
        }

        element = Element(nodeName, { 'attrs': attributes, 'context': context, 'decorate': false });

        // avoid mergeAttributes because it is buggy :/
        attributes = source.attributes || { };
        for (attr in attributes) {
          if (plugin.hasAttribute.call(source, attr)) {
            node = source.getAttributeNode(attr);
            attr = context.createAttribute(attr);
            element.setAttributeNode(attr);
            attr.value = node.value;
          }
        }
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
  		  if (nodeName == 'INPUT') {
  		    if (excludes.indexOf(' value ') == -1) {
  		      element.defaultValue = source.defaultValue;
  		      element.value = source.value;
  		    }
  		    if (CHECKED_INPUT_TYPES[element.type] &&
  		        excludes.indexOf(' checked ') == -1) {
  		      element.defaultChecked = source.defaultChecked;
  		      element.checked = source.checked;
  		    }
  		  }
  		  else if (prop = PROPS_TO_COPY[nodeName] &&
  		      excludes.indexOf(' ' + prop + ' ') == -1) {
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

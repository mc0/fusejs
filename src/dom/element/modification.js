  /*----------------------- HTML ELEMENT: MODIFICATION -----------------------*/

  (function(plugin) {

    var scripts,

    DO_NOT_DECORATE = { 'decorate': false },

    PARENT_NODE_AS_CONTEXT = { 'appendSibling': 1, 'prependSibling': 1 },

    PROPS_TO_COPY = { 'OPTION': 'selected', 'TEXTAREA': 'value' },

    DEFAULTS_TO_COPY = { 'selected': 'defaultSelected', 'value': 'defaultValue' },

    INSERTABLE_NODE_TYPES = { '1': 1, '3': 1, '8': 1, '10': 1, '11': 1 },

    ELEMENT_EVALS_SCRIPT_FROM_INNER_HTML =
      envTest('ELEMENT_EVALS_SCRIPT_FROM_INNER_HTML'),

    ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT =
      envTest('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT'),

    ELEMENT_SCRIPT_REEVALS_TEXT =
      envTest('ELEMENT_SCRIPT_REEVALS_TEXT'),

    ELEMENT_INNER_HTML_BUGGY = (function() {
      var T = !envTest('ELEMENT_INNER_HTML'), o = { };
      if (!T) {
        if (envTest('ELEMENT_COLGROUP_INNER_HTML_BUGGY')) {
          (T = T || o).COLGROUP = 1;
        }
        if (envTest('ELEMENT_OPTGROUP_INNER_HTML_BUGGY')) {
          (T = T || o).OPTGROUP = 1;
        }
        if (envTest('ELEMENT_SELECT_INNER_HTML_BUGGY')) {
          (T = T || o).SELECT = 1;
        }
        if (envTest('ELEMENT_TABLE_INNER_HTML_BUGGY')) {
          (T = T || o).TABLE = T.TBODY = T.TR = T.TD = T.TFOOT = T.TH = T.THEAD = 1;
        }
      }
      return T;
    })(),

    htmlPlugin = HTMLElement.plugin,

    cloneNode = function(source) {
      return source.cloneNode(false);
    },

    cloner = function(source, deep, isData, isEvents, excludes, context) {
      var addDispatcher, child, childQueue, children, data, i, id, j,
       newQueue, parentNode, parentQueue, srcData, srcEvents, k = 0,
       result = cloneNode(source, excludes, null, context);

      if (excludes) {
        i = excludes.length;
        while (i--) {
          plugin.removeAttribute.call(result, excludes[i]);
        }
      }
      if (isData || isEvents) {
        srcData = domData[getFuseId(source, true)];
        srcEvents = srcData && srcData.events;

        if (srcData && isData) {
          id || (id = getFuseId(result));
          data = domData[id];

          delete srcData.events;
          fuse.Object.extend(data, srcData);
          srcEvents && (srcData.events = srcEvents);
        }
        if (srcEvents && isEvents) {
          id   || (id = getFuseId(result));
          data || (data = domData[id]);
          addDispatcher = fuse.dom.Event._addDispatcher;

          // copy delegation watcher
          if (srcData._isWatchingDelegation) {
            fuse.dom.Event._addWatcher(result, data);
          }
          // copy events
          for (i in srcEvents) {
            addDispatcher(result, i, null, id);
            data.events[i].handlers = srcEvents[i].handlers.slice(0);
          }
        }
      }

      // http://www.jslab.dk/articles/non.recursive.preorder.traversal.part4
      if (deep) {
        parentNode  = result;
        childQueue  = source.childNodes;
        parentQueue = [parentNode, childQueue.length - 1];

        while (childQueue.length) {
          // drill down through the queued descendant children
          i = -1; newQueue = [];
          while (child = childQueue[++i]) {
            j = -1;
            children = child.childNodes;
            length   = children.length;
            child    = child.nodeType == ELEMENT_NODE
              ? cloner(child, false, isData, isEvents, excludes, context)
              : child.cloneNode(false);

            // jump to the next queued parent if starting a new child queue
            // or passed the child count of the current parent
            if ((i == 0 || i > parentQueue[k + 1]) && parentQueue[k + 2]) {
              parentNode = parentQueue[k += 2];
            }
            // if the child has children add it along with the last
            // childQueue index of its children to the parents queue
            if (length) {
              parentQueue.push(child, newQueue.length + length - 1);
            }
            // queue children of descendants
            while (++j < length) {
              newQueue.push(children[j]);
            }
            parentNode.appendChild(child);
          }
          childQueue = newQueue;
        }
      }
      return result;
    },

    getScripts = function(element) {
      var child, i, pad, nodes, result = [];
      if (getNodeName(element) == 'SCRIPT') {
        result[0] = element;
      }
      else {
        child = element.firstChild;
        while (child) {
          if (getNodeName(child) == 'SCRIPT') {
            result.push(child);
          }
          else if (typeof child.getElementsByTagName != 'undefined') {
            // concatList implementation for nodeLists
            i = 0; pad = result.length; nodes = child.getElementsByTagName('script');
            while (result[pad + i] = nodes[i++]) { }
            result.length--;
          }
          child = child.nextSibling;
        }
      }
      return result;
    },

    purgeDescendants = function(element) {
      var data, id, i = -1,
       elements = element.getElementsByTagName('*');

      while (element = elements[++i]) {
        if (element.nodeType == ELEMENT_NODE) {
          id = getFuseId(element, true);
          if (data = domData[id]) {
            data.events && htmlPlugin.stopObserving.call(element);
            delete domData[id];
          }
        }
      }
    },

    runScripts = function(element) {
      var context, isAttached, script, i = -1;
      if (scripts) {
        isAttached = !plugin.isDetached.call(element);
        while (script = scripts[++i]) {
          if (!plugin.hasAttribute.call(script, 'src') &&
              (!script.type || script.type.toLowerCase() == 'text/javascript')) {
            isAttached && fuse.run(getScriptText(script), context || (context = getDocument(element)));
          }
        }
      }
    },

    toNode = function(content, context) {
      var result, skipScripts;
      scripts = null;

      if (content || content == '0') {
        if (content.nodeName) {
          result = content && content.raw || content || { };
          // fix evaling inserted script elements in Safari <= 2.0.2 and Firefox 2.0.0.2
          skipScripts = !ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT;
        }
        else {
          result = getFragmentFromHTML(content, context);
          // skip evaling scripts created from a string in Firefox 3.x
          skipScripts = ELEMENT_EVALS_SCRIPT_FROM_INNER_HTML;
        }
        if (INSERTABLE_NODE_TYPES[result.nodeType]) {
          !skipScripts && (scripts = getScripts(result));
          return result;
        }
      }
    },

    updateElement = function(element, content) {
      var child;
      purgeDescendants(element);
      while (child = element.lastChild) {
        destroyElement(child, element);
      }
      if (content = toNode(content, element)) {
        element.appendChild(content);
        runScripts(element);
      }
    };

    /*------------------------------------------------------------------------*/

    plugin.cleanWhitespace = function cleanWhitespace() {
      // removes whitespace-only text node children
      var nextNode, element = this.raw || this, node = element.firstChild;
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
      var context, data, events, excludes, element = this.raw || this;
      if (deep && typeof deep == 'object') {
        context = deep.context;
        data = deep.data;
        events = deep.events;
        excludes = deep.excludes;
        deep = deep.data;
        if (excludes && !isArray(excludes)) {
          excludes = [excludes];
        }
      }
      return fromElement(cloner(element, deep, data, events, excludes, context || getDocument(element)));
    };

    plugin.destroy = function() {
      var element = this.raw || this;
      destroyElement(plugin.purge.call(element), element[PARENT_NODE]);
      this.raw && (this.raw = null);
      return null;
    };

    plugin.prependChildTo = function prependChildTo(content) {
      content && plugin.prependChild.call(content.raw || fuse(content, DO_NOT_DECORATE), this);
      return this;
    };

    plugin.appendChildTo = function appendChildTo(content) {
      content && plugin.appendChild.call(content.raw || fuse(content, DO_NOT_DECORATE), this);
      return this;
    };

    plugin.prependSiblingTo = function prependSiblingTo(content) {
      content && plugin.prependSibling.call(content.raw || fuse(content, DO_NOT_DECORATE), this);
      return this;
    };

    plugin.appendSiblingTo = function appendSiblingTo(content) {
      content && plugin.appendSibling.call(content.raw || fuse(content, DO_NOT_DECORATE), this);
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
        runScripts(element);
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

    plugin.purge = function purge() {
      var element = this.raw || this,
       id = getFuseId(element, true),
       data = domData[id];

      if (data) {
        data.events && htmlPlugin.stopObserving.call(element);
        delete domData[id];
      }
      purgeDescendants(element);
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
      content || content == '0' || (content = '');

      if (getNodeName(element) == 'SCRIPT') {
        setScriptText(element, content.nodeType == TEXT_NODE ?
          (content.raw || content).data : content);
        if (!ELEMENT_SCRIPT_REEVALS_TEXT) {
          scripts = [element];
          runScripts(element);
        }
      }
      else {
        purgeDescendants(element);
        if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          element.innerHTML = '';
          element.appendChild(content.raw || content);
        } else {
          element.innerHTML = content;
        }
        scripts = getScripts(element);
        runScripts(element);
      }
      return this;
    };

    plugin.wrap = function wrap(wrapper, attributes) {
      var rawWrapper, element = this.raw || this, 
       parentNode = element[PARENT_NODE],
       options = { 'attrs': attributes, 'context': element }

      if (isString(wrapper)) {
        wrapper = Element(wrapper, options);
      }
      if (isElement(wrapper)) {
        wrapper = plugin.setAttribute.call(wrapper, attributes);
      }
      else {
        options.attrs = wrapper;
        wrapper = HTMLElement('div', options);
      }
      rawWrapper = wrapper.raw || wrapper;
      if (parentNode) {
        parentNode.replaceChild(rawWrapper, element);
      }
      rawWrapper.appendChild(element);
      return wrapper;
    };

    /*------------------------------------------------------------------------*/

    // Fix browsers with buggy innerHTML implementations
    if (ELEMENT_INNER_HTML_BUGGY === true) {
      plugin.update = function update(content) {
        updateElement(this.raw || this, content);
        return this;
      };
    }
    else if (ELEMENT_INNER_HTML_BUGGY) {
      var __update = plugin.update;
      plugin.update = function update(content) {
        var element = this.raw || this;
        if (ELEMENT_INNER_HTML_BUGGY[getNodeName(element)]) {
          updateElement(element, content);
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

        element = Element(nodeName,
          { 'attrs': attributes, 'context': context, 'decorate': false });

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
    var appendChild =   null,
     appendChildTo =    null,
     appendSibling =    null,
     appendSiblingTo =  null,
     cleanWhitespace =  null,
     clone =            null,
     destroy =          null,
     prependChild =     null,
     prependChildTo =   null,
     prependSibling =   null,
     prependSiblingTo = null,
     purge =            null,
     remove =           null,
     replace =          null,
     wrap =             null;
  })(Element.plugin);

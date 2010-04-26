  /*-------------------------- ELEMENT: MODIFICATION -------------------------*/

  (function(plugin) {

    var TREAT_AS_STRING = { '[object Number]': 1, '[object String]': 1 },

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

    dom = fuse.dom,

    stripScripts   = fuse.String.plugin.stripScripts,

    evalScripts    = fuse.String.plugin.evalScripts,

    isScriptable   = stripScripts && evalScripts,

    reOpenScriptTag = /<script/i,

    rePositions = /^(?:(?:before|top|bottom|after)(?:,|$))+$/i,


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

    insertContent = function(element, parentNode, content, position) {
      var stripped, insertElement = ELEMENT_INSERT_METHODS[position];

      // process string / number
      if (TREAT_AS_STRING[toString.call(content)]) {
        stripped = isScriptable && reOpenScriptTag.test(content) ?
          stripScripts.call(content) : content;
        if (stripped != '') {
          insertElement(element,
            dom.getFragmentFromString(stripped, parentNode || element),
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
          return insertContent(element, parentNode, Obj.toHTML(content), position);
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
        } else if (!rePositions.test(Obj.keys(content))) {
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
      var html, stripped, element = this.raw || this;

      // process string / number
      if (TREAT_AS_STRING[toString.call(content)]) {
        html = content;
        stripped = isScriptable && reOpenScriptTag.test(content) ?
          stripScripts.call(content) : content;
        content = stripped == '' ? '' :
          dom.getFragmentFromString(stripped, element.parentNode);
        if (html != stripped) {
          setTimeout(function() { evalScripts.call(html); }, 10);
        }
      }
      // process object
      else if (content) {
        // process toHTML
        if (typeof content.toHTML === 'function') {
          return plugin.replace.call(this, Obj.toHTML(content));
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
          return plugin.update.call(this, Obj.toHTML(content));
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
        wrapper = Element.create(wrapper, attributes);
      }
      if (isElement(wrapper)) {
        wrapper = plugin.setAttribute.call(wrapper, attributes);
      }
      else {
        wrapper = Element.create('div', wrapper);
      }
      rawWrapper = wrapper.raw || wrapper;
      if (element.parentNode) {
        element.parentNode.replaceChild(rawWrapper, element);
      }
      rawWrapper.appendChild(element);
      return wrapper;
    };


    // fix inserting script elements in Safari <= 2.0.2 and Firefox 2.0.0.2
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
        T.before = function(element, node) { wrapper(before, element, node); };
        T.top    = function(element, node) { wrapper(top,    element, node); };
        T.bottom = function(element, node) { wrapper(bottom, element, node); };
        T.after  = function(element, node) { wrapper(after,  element, node); };
      })(ELEMENT_INSERT_METHODS);
    }

    // optimized for IE and Opera
    if (envTest('ELEMENT_REMOVE_NODE')) {
      plugin.remove = function remove() {
        (this.raw || this).removeNode(true);
        return this;
      };
    }

    // fix browsers with buggy innerHTML implementations
    if (ELEMENT_INNERHTML_BUGGY) {
      plugin.update = function update(content) {
        var isBuggy, stripped, element = this.raw || this,
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
        if (TREAT_AS_STRING[toString.call(content)]) {
          stripped = isScriptable && reOpenScriptTag.test(content) ?
            stripScripts.call(content) : content;
          if (stripped != '') {
            if (isBuggy) {
              element.appendChild(dom.getFragmentFromString(stripped, element));
            } else {
              element.innerHTML = stripped;
            }
          }
          if (content != stripped) {
            setTimeout(function() { evalScripts.call(content); }, 10);
          }
        }
        // process object
        else if (content) {
          // process toHTML
          if (typeof content.toHTML === 'function') {
            return plugin.update.call(this, Obj.toHTML(content));
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

    // prevent JScript bug with named function expressions
    var append =       nil,
     cleanWhitespace = nil,
     insert =          nil,
     insertAfter =     nil,
     insertBefore =    nil,
     prepend =         nil,
     remove =          nil,
     replace =         nil,
     wrap =            nil;
  })(Element.plugin);

  /*-------------------------- ELEMENT: MODIFICATION -------------------------*/

  (function(plugin) {

    var INSERT_POSITIONS_USING_PARENT_NODE = { 'before': 1, 'after': 1 },

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

    ELEMENT_INSERT_METHODS = {
      'before': function(element, node) {
        element.parentNode &&
          element.parentNode.insertBefore(node, element);
      },

      'top': function(element, node) {
        element.insertBefore(node, element.firstChild);
      },

      'bottom': function(element, node) {
        element.appendChild(node);
      },

      'after': function(element, node) {
        element.parentNode &&
          element.parentNode.insertBefore(node, element.nextSibling);
      }
    },

    dom = fuse.dom,

    setTimeout = global.setTimeout,

    setScriptText = (function() {
      if (envTest('ELEMENT_SCRIPT_HAS_TEXT_PROPERTY')) {
        return function(element, text) {
          element.text = text || '';
        };
      }

      var textNode = fuse._doc.createTextNode(''),
      setScriptText = function(element, text) {
        (element.firstChild || element.appendChild(textNode.cloneNode(false)))
          .data = text || '';
      };

      if (envTest('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT')) {
        return function(element, text) {
          set(element, text);
          global.eval(element.firstChild.data);
        };
      }

      return setScriptText;
    })(),

    replaceElement = (function() {
      var replaceElement = function(element, node) {
        element.parentNode.replaceChild(node, element);
      },

      getByTagName = function(node, tagName) {
        var results = [], child = node.firstChild;
        while (child) {
          if (getNodeName(child) === tagName) {
            results.push(child);
          }
          else if (child.getElementsByTagName) {
            // concatList implementation for nodeLists
            var i = 0, pad = results.length, nodes = child.getElementsByTagName(tagName);
            while (results[pad + i] = nodes[i++]) { }
            results.length--;
          }
          child = child.nextSibling;
        }
        return results;
      },

      wrapper = function(method, element, node) {
        var textNode, i = -1, scripts = [];

        method(element, node);

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

      // fix inserting script elements in Safari <= 2.0.2 and Firefox 2.0.0.2
      if (envTest('ELEMENT_SCRIPT_FAILS_TO_EVAL_TEXT')) {
        var T = ELEMENT_INSERT_METHODS, before = T.before, top = T.top,
         bottom = T.bottom, after = T.after;

        T.before = function(element, node) { wrapper(before, element, node); };
        T.top    = function(element, node) { wrapper(top,    element, node); };
        T.bottom = function(element, node) { wrapper(bottom, element, node); };
        T.after  = function(element, node) { wrapper(after,  element, node); };

        return function(element, node) {
          wrapper(replaceElement, element, node);
        };
      }
      return replaceElement;
    })(),

    update = function update(content) {
      var stripped, element = this.raw || this;
      if (getNodeName(element) === 'SCRIPT') {
        setScriptText(element, content);
      }
      else if (content && content != '') {
        if (content.toElement) {
          content = content.toElement();
        }
        if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          element.innerHTML = '';
          element.appendChild(content.raw || content);
        }
        else {
          content = Obj.toHTML(content);
          element.innerHTML =
          stripped = content.stripScripts();

          if (content != stripped) {
            setTimeout(function() { content.evalScripts(); }, 10);
          }
        }
      } else {
        element.innerHTML = '';
      }
      return this;
    };

    // Fix browsers with buggy innerHTML implementations
    if (ELEMENT_INNERHTML_BUGGY) {
      update = function update(content) {
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
        // set content
        if (content && content != '') {
          if (content.toElement) {
            content = content.toElement();
          }
          if (INSERTABLE_NODE_TYPES[content.nodeType]) {
            if (!isBuggy) element.innerHTML = '';
            element.appendChild(content.raw || content);
          } else {
            content = Obj.toHTML(content);
            stripped = content.stripScripts();

            if (stripped != '') {
              if (isBuggy) {
                element.appendChild(dom.getFragmentFromString(stripped, element));
              } else {
                element.innerHTML = stripped;
              }
            }
            if (content != stripped) {
              setTimeout(function() { content.evalScripts(); }, 10);
            }
          }
        } else if (!isBuggy) {
          element.innerHTML = '';
        }
        return this;
      };
    }

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

    plugin.insert = function insert(insertions) {
      var content, insertContent, nodeName, position, stripped,
       element = this.raw || this;

      if (insertions) {
        if (isHash(insertions)) {
          insertions = insertions._object;
        }

        content = insertions.raw || insertions;
        if (isString(content) || isNumber(content) ||
            INSERTABLE_NODE_TYPES[content.nodeType] ||
            content.toElement || content.toHTML) {
          insertions = { 'bottom': content };
        }
      }

      for (position in insertions) {
        content  = insertions[position];
        position = position.toLowerCase();
        insertContent = ELEMENT_INSERT_METHODS[position];

        if (content && content != '') {
          if (content.toElement) {
            content = content.toElement();
          }
          if (INSERTABLE_NODE_TYPES[content.nodeType]) {
            insertContent(element, content.raw || content);
          }
          else if ((content = Obj.toHTML(content)) != '') {
            if ((stripped = content.stripScripts()) != '') {
              insertContent(element, dom.getFragmentFromString(stripped,
                INSERT_POSITIONS_USING_PARENT_NODE[position] ? element.parentNode : element));
            }
            // only evalScripts if there are scripts
            if (content != stripped) {
              setTimeout(function() { content.evalScripts(); }, 10);
            }
          }
        }
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

      if (content && content != '') {
        if (content.toElement) {
          content = content.toElement();
        } else if (INSERTABLE_NODE_TYPES[content.nodeType]) {
          content = content.raw || content;
        } else {
          html = Obj.toHTML(content);
          stripped = html.stripScripts();
          content = stripped == '' ? '' :
            dom.getFragmentFromString(stripped, element.parentNode);

          if (content != stripped) {
            setTimeout(function() { html.evalScripts(); }, 10);
          }
        }
      }

      if (!content || content == '') {
        element.parentNode.removeChild(element);
      } else if (INSERTABLE_NODE_TYPES[content.nodeType]) {
        replaceElement(element, content);
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

    plugin.update = update;

    // prevent JScript bug with named function expressions
    var cleanWhitespace = nil, insert = nil, remove = nil, replace = nil, wrap = nil;
  })(Element.plugin);

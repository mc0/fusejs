  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  (function(plugin) {
    // support W3C ElementTraversal interface
    var firstNode = 'firstChild',

    lastNode      = 'lastChild',

    nextNode      = 'nextSibling',

    prevNode      = 'previousSibling',

    nextElement   = 'nextElementSibling',

    prevElement   = 'previousElementSibling',

    getSome = function(element, property, selectors, count) {
      var match, result = null, i = 0;
      if (!element) return result;

      // handle when a callback and optional thisArg is passed
      // thisArg = count, callback = selectors;
      if (typeof selectors === 'function') {
        do {
          if (element.nodeType === ELEMENT_NODE && selectors.call(count, element))
            return fromElement(element);
        } while (element = (element.raw || element)[property]);
      }
      else {
        if (isNumber(selectors)) {
          count = selectors;
          selectors = null;
        }

        if (count > 1) {
          result = NodeList();
        } else {
          count = 1;
        }

        // handle no arguments
        if (selectors == null) {
          // handle returning first match
          if (count == 1) {
            do {
              if (element.nodeType === ELEMENT_NODE)
                return fromElement(element);
            } while (element = element[property]);
          }
          // handle returning a number of matches
          else {
            do {
              if (i < count && element.nodeType === ELEMENT_NODE)
                result[i++] = fromElement(element);
            } while (element = element[property]);
          }
        }
        // handle when selectors are passed
        else if (isString(selectors)) {
          match = fuse.dom.selector.match;

          // handle returning first match
          if (count == 1) {
            do {
              if (element.nodeType === ELEMENT_NODE && match(element, selectors))
                return fromElement(element);
            } while (element = element[property]);
          }
          // handle returning a number of matches
          else {
            do {
              if (i < count && element.nodeType === ELEMENT_NODE &&
                  match(element, selectors))
                result[i++] = fromElement(element);
            } while (element = element[property]);
          }
        }
      }
      return result;
    };

    if (isHostObject(fuse._docEl, nextElement) &&
        isHostObject(fuse._docEl, prevElement)) {
      nextNode  = nextElement;
      prevNode  = prevElement;
      firstNode = 'firstElementChild';
      lastNode  = 'lastElementChild';
    }

    /*------------------------------------------------------------------------*/

    plugin.getChildren = function getChildren(selectors) {
      var element = (this.raw || this)[firstNode];
      while (element && element.nodeType !== ELEMENT_NODE) {
        element = element[nextNode];
      }
      if (!element) {
        return NodeList();
      }

      element = fromElement(element);
      return !selectors || selectors == '' ||
          selectors && fuse.dom.selector.match(element, selectors)
        ? concatList(NodeList(element), plugin.getNextSiblings.call(element, selectors))
        : plugin.getNextSiblings.call(element, selectors);
    };

    plugin.getSiblings = function getSiblings(selectors) {
      var match, element = this.raw || this, i = 0,
       original = element, result = NodeList();

      if (element = element.parentNode) {
        element = element[firstNode];
        if (selectors && selectors.length) {
          match = fuse.dom.selector.match;
          do {
            if (element.nodeType === ELEMENT_NODE &&
                element !== original && match(element, selectors))
              result[i++] = fromElement(element);
          } while (element = element[nextNode]);
        } else {
          do {
            if (element.nodeType === ELEMENT_NODE && element !== original)
              result[i++] = fromElement(element);
          } while (element = element[nextNode]);
        }
      }
      return result;
    };

    plugin.down = function down(selectors, count) {
      var match, node, nodes, result = null, i = 0, j = 0,
       element = this.raw || this;

      // handle when a callback and optional thisArg is passed
      // thisArg = count, callback = selectors;
      if (typeof selectors === 'function') {
        nodes = element.getElementsByTagName('*');
        while (node = nodes[i++]) {
          if (node.nodeType === ELEMENT_NODE && selectors.call(count, node))
            return fromElement(node);
        }
      }
      else {
        if (isNumber(selectors)) {
          count = selectors;
          selectors = null;
        }

        if (count > 1) {
          result = NodeList();
        } else {
          count = 1;
        }

        // handle no arguments
        if (selectors == null) {
          // handle returning first match
          if (count == 1) {
            return plugin.first.call(this);
          }

          // handle returning a number of matches
          nodes = element.getElementsByTagName('*');
          while (node = nodes[i++]) {
            if (j < count && node.nodeType === ELEMENT_NODE)
              result[j++] = fromElement(node);
          }
        }
        // handle when selectors are passed
        else if (isString(selectors)) {
          match = fuse.dom.selector.match;
          nodes = element.getElementsByTagName('*');

          // handle returning first match
          if (count == 1) {
            while (node = nodes[i++]) {
              if (node.nodeType === ELEMENT_NODE && match(node, selectors))
                return fromElement(node);
            }
          }
          // handle returning a number of matches
          else {
            while (node = nodes[i++]) {
              if (j < count && node.nodeType === ELEMENT_NODE &&
                  match(node, selectors))
                result[j++] = fromElement(node);
            }
          }
        }
      }
      return result;
    };

    plugin.next = function next(selectors, count) {
      return getSome((this.raw || this)[nextNode], nextNode, selectors, count);
    };

    plugin.previous = function previous(selectors, count) {
      return getSome((this.raw || this)[prevNode], prevNode, selectors, count);
    };

    plugin.up = function up(selectors, count) {
      return getSome((this.raw || this).parentNode, 'parentNode', selectors, count);
    };

    plugin.first = function first(selectors, count) {
      return getSome((this.raw || this)[firstNode], nextNode, selectors, count);
    };

    plugin.last = function last(selectors, count) {
      return getSome((this.raw || this)[lastNode], prevNode, selectors, count);
    };

    plugin.getAncestors = function getAncestors(selectors) {
      return getSome((this.raw || this).parentNode, 'parentNode', selectors, Infinity) || NodeList();
    };

    plugin.getDescendants = function getDescendants(selectors) {
      return plugin.down.call(this, selectors, Infinity);
    };

    plugin.getNextSiblings = function getNextSiblings(selectors) {
      return getSome((this.raw || this)[nextNode], nextNode, selectors, Infinity) || NodeList();
    };

    plugin.getPreviousSiblings = function getPreviousSiblings(selectors) {
      return getSome((this.raw || this)[prevNode], prevNode, selectors, Infinity) || NodeList();
    };

    // prevent JScript bug with named function expressions
    var down =             nil,
     first =               nil,
     getAncestors =        nil,
     getChildren =         nil,
     getDescendants =      nil,
     getNextSiblings =     nil,
     getPreviousSiblings = nil,
     getSiblings =         nil,
     last =                nil,
     next =                nil,
     previous =            nil,
     up =                  nil;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  Element.plugin.contains = (function() {
    var contains = function contains(descendant) {
      if (descendant = fuse.get(descendant)) {
        var element = this.raw || this;
        descendant = descendant.raw || descendant;
        while (descendant = descendant.parentNode)
          if (descendant === element) return true;
      }
      return false;
    };

    if (envTest('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
      contains = function contains(descendant) {
        /* DOCUMENT_POSITION_CONTAINS = 0x08 */
        if (descendant = fuse.get(descendant)) {
          var element = this.raw || this;
          return ((descendant.raw || descendant)
            .compareDocumentPosition(element) & 8) === 8;
        }
        return false;
      };
    }
    else if (envTest('ELEMENT_CONTAINS')) {
      var __contains = contains;
      contains = function contains(descendant) {
        if (this.nodeType !== ELEMENT_NODE)
          return __contains.call(this, descendant);

        descendant = fuse.get(descendant);
        var descendantElem = descendant.raw || descendant,
         element = this.raw || this;

        return element !== descendantElem && element.contains(descendantElem);
      };
    }
    return contains;
  })();

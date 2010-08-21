  /*--------------------------- ELEMENT: TRAVERSAL ---------------------------*/

  (function(plugin) {
    // support W3C ElementTraversal interface
    var firstNode = 'firstChild',

    lastNode      = 'lastChild',

    nextNode      = 'nextSibling',

    prevNode      = 'previousSibling',

    nextElement   = 'nextElementSibling',

    prevElement   = 'previousElementSibling',

    getSome = function(element, property, count, selectors, thisArg) {
      var isSingle, match, result = null, i = 0;
      if (!element) return result;

      if (toString.call(count) != '[object Number]') {
        selectors = count;
        count = null;
      }
      if (!(isSingle = count == null)) {
        if (count < 1) count = 1;
        result = NodeList();
      }

      // handle when a callback and optional thisArg is passed
      // callback = selectors;
      if (typeof selectors == 'function') {
        // handle returning first match
        if (isSingle) {
          do {
            if (element.nodeType == ELEMENT_NODE && selectors.call(thisArg, element))
              return fromElement(element);
          } while (element = element[property]);
        }
        // handle returning a number of matches
        else {
          do {
            if (element.nodeType == ELEMENT_NODE && selectors.call(count, element))
              result[i++] = fromElement(element);
          } while (i < count && (element = element[property]));
        }
      }
      else {
        // handle no arguments
        if (selectors == null) {
          // handle returning first match
          if (isSingle) {
            do {
              if (element.nodeType == ELEMENT_NODE)
                return fromElement(element);
            } while (element = element[property]);
          }
          // handle returning a number of matches
          else {
            do {
              if (element.nodeType == ELEMENT_NODE)
                result[i++] = fromElement(element);
            } while (i < count && (element = element[property]));
          }
        }
        // handle when selectors are passed
        else if (isString(selectors)) {
          // handle returning first match
          match = fuse.dom.selector.match;
          if (isSingle) {
            do {
              if (element.nodeType == ELEMENT_NODE && match(element, selectors))
                return fromElement(element);
            } while (element = element[property]);
          }
          // handle returning a number of matches
          else {
            do {
              if (element.nodeType == ELEMENT_NODE &&
                  match(element, selectors))
                result[i++] = fromElement(element);
            } while (i < count && (element = element[property]));
          }
        }
      }
      return result;
    };

    if (isHostType(fuse._docEl, nextElement) &&
        isHostType(fuse._docEl, prevElement)) {
      nextNode  = nextElement;
      prevNode  = prevElement;
      firstNode = 'firstElementChild';
      lastNode  = 'lastElementChild';
    }

    /*------------------------------------------------------------------------*/

    plugin.getChildren = function getChildren(selectors) {
      var element = (this.raw || this)[firstNode];
      while (element && element.nodeType != ELEMENT_NODE) {
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

      if (element = element[PARENT_NODE]) {
        element = element[firstNode];
        if (selectors && selectors.length) {
          match = fuse.dom.selector.match;
          do {
            if (element.nodeType == ELEMENT_NODE &&
                element !== original && match(element, selectors))
              result[i++] = fromElement(element);
          } while (element = element[nextNode]);
        } else {
          do {
            if (element.nodeType == ELEMENT_NODE && element != original)
              result[i++] = fromElement(element);
          } while (element = element[nextNode]);
        }
      }
      return result;
    };

    plugin.down = function down(count, selectors, thisArg) {
      var isSingle, match, node, nodes, result = null, i = 0, j = 0,
       element = this.raw || this;

      if (toString.call(count) != '[object Number]') {
        selectors = count;
        count = null;
      }
      if (!(isSingle = count == null)) {
        if (count < 1) count = 1;
        result = NodeList();
      }
      if (!(isSingle && selectors == null)) {
        nodes = element.getElementsByTagName('*');
      }

      // handle when a callback and optional thisArg is passed
      // callback = selectors;
      if (typeof selectors == 'function') {
        // handle returning first match
        if (isSingle) {
          while (node = nodes[i++]) {
            if (node.nodeType == ELEMENT_NODE && selectors.call(thisArg, node))
              return fromElement(node);
          }
        }
        // handle returning a number of matches
        else {
          while (j < count && (node = nodes[i++])) {
            if (node.nodeType == ELEMENT_NODE && selectors.call(count, node))
              result[j++] = fromElement(node);
          }
        }
      }
      else {
        // handle no arguments
        if (selectors == null) {
          // handle returning first match
          if (isSingle) {
            return plugin.first.call(this);
          }
          // handle returning a number of matches
          while (j < count && (node = nodes[i++])) {
            if (node.nodeType == ELEMENT_NODE)
              result[j++] = fromElement(node);
          }
        }
        // handle when selectors are passed
        else if (isString(selectors)) {
          // handle returning first match
          match = fuse.dom.selector.match;
          if (isSingle) {
            while (node = nodes[i++]) {
              if (node.nodeType == ELEMENT_NODE && match(node, selectors))
                return fromElement(node);
            }
          }
          // handle returning a number of matches
          else {
            while (j < count && (node = nodes[i++])) {
              if (node.nodeType == ELEMENT_NODE && match(node, selectors))
                result[j++] = fromElement(node);
            }
          }
        }
      }
      return result;
    };

    plugin.next = function next(count, selectors, thisArg) {
      return getSome((this.raw || this)[nextNode], nextNode, count, selectors, thisArg);
    };

    plugin.previous = function previous(count, selectors, thisArg) {
      return getSome((this.raw || this)[prevNode], prevNode, count, selectors, thisArg);
    };

    plugin.up = function up(count, selectors, thisArg) {
      return getSome((this.raw || this)[PARENT_NODE], PARENT_NODE, count, selectors, thisArg);
    };

    plugin.first = function first(count, selectors, thisArg) {
      return getSome((this.raw || this)[firstNode], nextNode, count, selectors, thisArg);
    };

    plugin.last = function last(count, selectors, thisArg) {
      return getSome((this.raw || this)[lastNode], prevNode, count, selectors, thisArg);
    };

    plugin.getAncestors = function getAncestors(selectors, thisArg) {
      return getSome((this.raw || this)[PARENT_NODE], PARENT_NODE, Infinity, selectors, thisArg) || NodeList();
    };

    plugin.getDescendants = function getDescendants(selectors, thisArg) {
      return plugin.down.call(this, Infinity, selectors, thisArg);
    };

    plugin.getNextSiblings = function getNextSiblings(selectors, thisArg) {
      return getSome((this.raw || this)[nextNode], nextNode, Infinity, selectors, thisArg) || NodeList();
    };

    plugin.getPreviousSiblings = function getPreviousSiblings(selectors, thisArg) {
      return getSome((this.raw || this)[prevNode], prevNode, Infinity, selectors, thisArg) || NodeList();
    };

    // prevent JScript bug with named function expressions
    var down =             null,
     first =               null,
     getAncestors =        null,
     getChildren =         null,
     getDescendants =      null,
     getNextSiblings =     null,
     getPreviousSiblings = null,
     getSiblings =         null,
     last =                null,
     next =                null,
     previous =            null,
     up =                  null;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  Element.plugin.contains = (function() {
    var contains = function contains(descendant) {
      if (descendant = fuse(descendant)) {
        var element = this.raw || this;
        descendant = descendant.raw || descendant;
        while (descendant = descendant[PARENT_NODE])
          if (descendant == element) return true;
      }
      return false;
    };

    if (envTest('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
      contains = function contains(descendant) {
        /* DOCUMENT_POSITION_CONTAINS = 0x08 */
        if (descendant = fuse(descendant)) {
          var element = this.raw || this;
          return ((descendant.raw || descendant)
            .compareDocumentPosition(element) & 8) == 8;
        }
        return false;
      };
    }
    else if (envTest('ELEMENT_CONTAINS')) {
      var __contains = contains;
      contains = function contains(descendant) {
        if (this.nodeType != ELEMENT_NODE)
          return __contains.call(this, descendant);

        descendant = fuse(descendant);
        var descendantElem = descendant.raw || descendant,
         element = this.raw || this;

        return element != descendantElem && element.contains(descendantElem);
      };
    }
    return contains;
  })();

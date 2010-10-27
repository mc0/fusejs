  /*------------------------ HTML ELEMENT: TRAVERSAL -------------------------*/

  (function(plugin) {

    // support W3C ElementTraversal interface
    var FIRST_NODE = 'firstChild',
     LAST_NODE     = 'lastChild',
     NEXT_NODE     = 'nextSibling',
     PREV_NODE     = 'previousSibling',
     NEXT_ELEMENT  = 'nextElementSibling',
     PREV_ELEMENT  = 'previousElementSibling',
     NodeList      = fuse.dom.NodeList,
     fromElement   = fuse.dom.Element.from;

    if (fuse.Object.isHostType(fuse._docEl, NEXT_ELEMENT) &&
        fuse.Object.isHostType(fuse._docEl, PREV_ELEMENT)) {
      NEXT_NODE  = NEXT_ELEMENT;
      PREV_NODE  = PREV_ELEMENT;
      FIRST_NODE = 'firstElementChild';
      LAST_NODE  = 'lastElementChild';
    }

    /*------------------------------------------------------------------------*/

    function getSome(element, property, count, selectors, thisArg) {
      var isSingle, match, result = null, i = 0;
      if (!element) {
        return result;
      }
      if (!fuse.Object.isNumber(count)) {
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
            if (element.nodeType == 1 && selectors.call(thisArg, element))
              return fromElement(element);
          } while (element = element[property]);
        }
        // handle returning a number of matches
        else {
          do {
            if (element.nodeType == 1 && selectors.call(count, element))
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
              if (element.nodeType == 1)
                return fromElement(element);
            } while (element = element[property]);
          }
          // handle returning a number of matches
          else {
            do {
              if (element.nodeType == 1)
                result[i++] = fromElement(element);
            } while (i < count && (element = element[property]));
          }
        }
        // handle when selectors are passed
        else if (fuse.Object.isString(selectors)) {
          // handle returning first match
          match = fuse.dom.selector.match;
          if (isSingle) {
            do {
              if (element.nodeType == 1 && match(element, selectors))
                return fromElement(element);
            } while (element = element[property]);
          }
          // handle returning a number of matches
          else {
            do {
              if (element.nodeType == 1 &&
                  match(element, selectors))
                result[i++] = fromElement(element);
            } while (i < count && (element = element[property]));
          }
        }
      }
      return result;
    }

    function getChildren(selectors) {
      var element = (this.raw || this)[FIRST_NODE];
      while (element && element.nodeType != 1) {
        element = element[NEXT_NODE];
      }
      if (!element) {
        return NodeList();
      }
      element = fromElement(element);
      return !selectors || selectors == '' ||
          selectors && fuse.dom.selector.match(element, selectors)
        ? fuse._.concatList(NodeList(element), plugin.getNextSiblings.call(element, selectors))
        : plugin.getNextSiblings.call(element, selectors);
    }

    function getSiblings(selectors) {
      var match, element = this.raw || this, i = 0,
       original = element, result = NodeList();

      if (element = element[PARENT_NODE]) {
        element = element[FIRST_NODE];
        if (selectors && selectors.length) {
          match = fuse.dom.selector.match;
          do {
            if (element.nodeType == 1 &&
                element !== original && match(element, selectors))
              result[i++] = fromElement(element);
          } while (element = element[NEXT_NODE]);
        } else {
          do {
            if (element.nodeType == 1 && element != original)
              result[i++] = fromElement(element);
          } while (element = element[NEXT_NODE]);
        }
      }
      return result;
    }

    function down(count, selectors, thisArg) {
      var isSingle, match, node, nodes, result = null, i = 0, j = 0,
       element = this.raw || this;

      if (fuse._.toString.call(count) != '[object Number]') {
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
            if (node.nodeType == 1 && selectors.call(thisArg, node))
              return fromElement(node);
          }
        }
        // handle returning a number of matches
        else {
          while (j < count && (node = nodes[i++])) {
            if (node.nodeType == 1 && selectors.call(count, node))
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
            if (node.nodeType == 1)
              result[j++] = fromElement(node);
          }
        }
        // handle when selectors are passed
        else if (fuse.Object.isString(selectors)) {
          // handle returning first match
          match = fuse.dom.selector.match;
          if (isSingle) {
            while (node = nodes[i++]) {
              if (node.nodeType == 1 && match(node, selectors))
                return fromElement(node);
            }
          }
          // handle returning a number of matches
          else {
            while (j < count && (node = nodes[i++])) {
              if (node.nodeType == 1 && match(node, selectors))
                result[j++] = fromElement(node);
            }
          }
        }
      }
      return result;
    }

    function next(count, selectors, thisArg) {
      return getSome((this.raw || this)[NEXT_NODE], NEXT_NODE, count, selectors, thisArg);
    }

    function previous(count, selectors, thisArg) {
      return getSome((this.raw || this)[PREV_NODE], PREV_NODE, count, selectors, thisArg);
    }

    function up(count, selectors, thisArg) {
      return getSome((this.raw || this)[PARENT_NODE], PARENT_NODE, count, selectors, thisArg);
    }

    function first(count, selectors, thisArg) {
      return getSome((this.raw || this)[FIRST_NODE], NEXT_NODE, count, selectors, thisArg);
    }

    function last(count, selectors, thisArg) {
      return getSome((this.raw || this)[LAST_NODE], PREV_NODE, count, selectors, thisArg);
    }

    function getAncestors(selectors, thisArg) {
      return getSome((this.raw || this)[PARENT_NODE], PARENT_NODE, Infinity, selectors, thisArg) || NodeList();
    }

    function getDescendants(selectors, thisArg) {
      return plugin.down.call(this, Infinity, selectors, thisArg);
    }

    function getNextSiblings(selectors, thisArg) {
      return getSome((this.raw || this)[NEXT_NODE], NEXT_NODE, Infinity, selectors, thisArg) || NodeList();
    }

    function getPreviousSiblings(selectors, thisArg) {
      return getSome((this.raw || this)[PREV_NODE], PREV_NODE, Infinity, selectors, thisArg) || NodeList();
    }

    plugin.getChildren = getChildren;
    plugin.getSiblings = getSiblings;
    plugin.down = down;
    plugin.next = next;
    plugin.previous = previous;
    plugin.up = up;
    plugin.first = first;
    plugin.last = last;
    plugin.getAncestors = getAncestors;
    plugin.getDescendants = getDescendants;
    plugin.getNextSiblings = getNextSiblings;
    plugin.getPreviousSiblings = getPreviousSiblings;

  })(fuse.dom.Element.plugin);

  /*--------------------------------------------------------------------------*/

  fuse.dom.Element.plugin.contains = (function() {
    var contains = function contains(descendant) {
      if (descendant = fuse(descendant)) {
        var element = this.raw || this;
        descendant = descendant.raw || descendant;
        while (descendant = descendant[PARENT_NODE]) {
          if (descendant == element) return true;
        }
      }
      return false;
    };

    if (fuse.env.test('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
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
    else if (fuse.env.test('ELEMENT_CONTAINS')) {
      var __contains = contains;
      contains = function contains(descendant) {
        if (this.nodeType != 1) {
          return __contains.call(this, descendant);
        }
        descendant = fuse(descendant);
        var descendantElem = descendant.raw || descendant,
         element = this.raw || this;

        return element != descendantElem && element.contains(descendantElem);
      };
    }
    return contains;
  })();

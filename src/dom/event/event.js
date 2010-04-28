  /*---------------------------------- EVENT ---------------------------------*/

  Event =
  fuse.dom.Event = (function() {
    var Decorator = function(event, target) {
      var getCurrentTarget = 
      this.getCurrentTarget = function getCurrentTarget() {
        var getCurrentTarget = function getCurrentTarget() { return target; };
        if (target) target = fromElement(target);
        this.getCurrentTarget = getCurrentTarget;
        return target;
      };
    },

    Event = function Event(event, target) {
      var decorated;
      if (event) {
        if (typeof event.raw !== 'undefined') {
          return event;
        }
        decorated = new Decorator(event, target);
        decorated.raw  = event;
        decorated.type = event.type;
      }
      else {
        // fired events have no raw
        decorated = new Decorator(event, target);
        decorated.raw = null;
      }
      return decorated;
    };

    Class({ 'constructor': Event });
    Decorator.prototype = Event.plugin;
    return Event;
  })();

  Event.addStatics({
    'KEY_BACKSPACE': 8,
    'KEY_DELETE':    46,
    'KEY_DOWN':      40,
    'KEY_END':       35,
    'KEY_ESC':       27,
    'KEY_HOME':      36,
    'KEY_INSERT':    45,
    'KEY_LEFT':      37,
    'KEY_PAGEDOWN':  34,
    'KEY_PAGEUP':    33,
    'KEY_RETURN':    13,
    'KEY_RIGHT':     39,
    'KEY_TAB':       9,
    'KEY_UP':        38,
    'updateGenerics': Node.updateGenerics
  });

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var domLoadDispatcher, winLoadDispatcher,

    BUGGY_EVENT_TYPES = { 'error': 1, 'load': 1 },

    CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 },

    arrIndexOf = fuse.Array.plugin.indexOf.raw,

    // lazy define on first call
    // compatibility charts found at http://unixpapa.com/js/mouse.html
    defineIsClick = function() {
      // fired events have no raw
      if (!this.raw) return false;

      var CLICK_MAP = { 'L': 1, 'M': 2, 'R': 3 },

      property = 'which',

      isLeftClick = function isLeftClick() {
        var event = this.raw;
        return (this.isLeftClick = event && event[property] === CLICK_MAP.L
          ? Func.TRUE
          : Func.FALSE)();
      },

      isMiddleClick = function isMiddleClick() {
        var event = this.raw;
        return (this.isMiddleClick = event && event[property] === CLICK_MAP.M
          ? Func.TRUE
          : Func.FALSE)();
      },

      isRightClick = function isRightClick() {
        var event = this.raw;
        return (this.isRightClick = event && event[property] === CLICK_MAP.R
          ? Func.TRUE
          : Func.FALSE)();
      };

      // for non IE
      if (typeof this.raw.which === 'number') {
        // simulate a middle click by pressing the Apple key in Safari 2.x
        if (typeof this.raw.metaKey === 'boolean') {
          isMiddleClick = function isMiddleClick() {
            var result, which, event = this.raw;
            if (event) {
              which  = event.which;
              result = which === CLICK_MAP.L ? event.metaKey : which === CLICK_MAP.M;
            }
            return (this.isMiddleClick = result ? Func.TRUE : Func.FALSE)();
          };
        }
      }
      // for IE
      // check for `button` second for browsers that have `which` and `button`
      else if (typeof this.raw.button === 'number') {
        CLICK_MAP = { 'L': 1, 'M': 4, 'R': 2 };
        property = 'button';
      }
      // fallback
      else {
        isLeftClick   =
        isMiddleClick =
        isRightClick  = Func.FALSE;
      }

      plugin.isLeftClick   = isLeftClick;
      plugin.isMiddleClick = isMiddleClick;
      plugin.isRightClick  = isRightClick;
      return this[arguments[0]]();
    },

    definePointerXY = function() {
      // fired events have no raw
      if (!this.raw) return 0;

      // defacto standard
      var getPointerX, getPointerY;
      if (typeof this.raw.pageX === 'number') {
        getPointerX = function getPointerX() {
          return this.raw && this.raw.pageX || 0;
        };

        getPointerY = function getPointerY() {
          return this.raw && this.raw.pageY || 0;
        };
      }
      // IE and others
      else {
        var info = fuse._info,
         doc  = getDocument(this.getTarget() || global),
         root = doc[info.root.property],
         scrollEl = doc[info.scrollEl.property];

        if (!root || !scrollEl) return 0;
        doc = root = scrollEl = nil;

        getPointerX = function getPointerX() {
          // fired events have no raw
          if (!this.raw) return 0;

          var doc = getDocument(this.getTarget() || global),
           root = doc[info.root.property],
           scrollEl = doc[info.scrollEl.property],
           getPointerX = function getPointerX() { return x; },
           x = this.raw.clientX + scrollEl.scrollLeft - root.clientLeft;

          if (x < 0) x = 0;
          this.getPointerX = getPointerX;
          return x;
        };

        getPointerY = function getPointerY() {
          // fired events have no raw
          if (!this.raw) return 0;

          var doc = getDocument(this.getTarget() || global),
           root = doc[info.root.property],
           scrollEl = doc[info.scrollEl.property],
           getPointerY = function getPointerY() { return y; },
           y = this.raw.clientY + scrollEl.scrollTop - root.clientTop;

          if (y < 0) y = 0;
          this.getPointerY = getPointerY;
          return y;
        };
      }

      plugin.getPointerX = getPointerX;
      plugin.getPointerY = getPointerY;
      return this[arguments[0]]();
    },

    addCache = function(id, type, handler) {
      // bail if handler is already exists
      var ec = getOrCreateCache(id, type);
      if (arrIndexOf.call(ec.handlers, handler) != -1) {
        return false;
      }
      ec.handlers.unshift(handler);
      return ec.dispatcher
        ? false
        : (ec.dispatcher = createDispatcher(id, type));
    },

    getOrCreateCache = function(id, type) {
      var data = domData[id], events = data.events || (data.events = { });
      return events[type] ||
        (events[type] = { 'handlers': [], 'dispatcher': false });
    },

    removeCacheAtIndex = function(id, type, index) {
      // remove responders and handlers at the given index
      var events = domData[id].events, ec = events[type];
      ec.handlers.splice(index, 1);

      // if no more handlers/responders then
      // remove the event type cache
      if (!ec.handlers.length) delete events[type];
    },

    addObserver = function(element, type, handler) {
      element.addEventListener(type, handler, false);
    },

    removeObserver = function(element, type, handler) {
      element.removeEventListener(type, handler, false);
    },

    // Event dispatchers manage several handlers and ensure
    // FIFO execution order. They are attached as the event
    // listener and execute all the handlers they manage.
    createDispatcher = function(id, type) {
      return function(event) {
        // shallow copy handlers to avoid issues with nested observe/stopObserving
        var data   = domData[id],
         decorator = data.decorator,
         node      = decorator.raw,
         handlers  = slice.call(data.events[type].handlers, 0),
         length    = handlers.length;

        event = Event(event || getWindow(node).event, node);
        while (length--) {
          // stop event if handler result is false
          if (handlers[length].call(decorator, event) === false) {
            event.stop();
          }
        }
      };
    },
 
    // Ensure that the dom:loaded event has finished
    // executing its observers before allowing the
    // window onload event to proceed.
    domLoadWrapper = function(event) {
      var doc = fuse._doc, docEl = fuse._docEl,
       decoratedDoc = fuse.get(doc);

      if (!decoratedDoc.isLoaded()) {
        event = Event(event || global.event, doc);
        event.type = 'dom:loaded';

        // define pseudo private body and root properties
        fuse._body     =
        fuse._scrollEl = doc.body;
        fuse._root     = docEl;

        if (envTest('BODY_ACTING_AS_ROOT')) {
          fuse._root = doc.body;
          fuse._info.root = fuse._info.body;
        }
        if (envTest('BODY_SCROLL_COORDS_ON_DOCUMENT_ELEMENT')) {
          fuse._scrollEl = docEl;
          fuse._info.scrollEl = fuse._info.docEl;
        }

        decoratedDoc.isLoaded = Func.TRUE;
        domLoadDispatcher(event);
        decoratedDoc.stopObserving('dom:loaded');
      }
    },

    winLoadWrapper = function(event) {
      event || (event = global.event);
      if (!fuse.get(fuse._doc).isLoaded()) {
        domLoadWrapper(event);
      }
      else if (domData[2] && domData[2].events['dom:loaded']) {
        return setTimeout(function() { winLoadWrapper(event); }, 10);
      }
      event = Event(event, global);
      event.type = 'load';
      winLoadDispatcher(event);
      fuse.get(global).stopObserving('load');
    };

    /*------------------------------------------------------------------------*/

    if (!envTest('ELEMENT_ADD_EVENT_LISTENER')) {
      // JScript
      if (envTest('ELEMENT_ATTACH_EVENT')) {
        addObserver = function(element, type, handler) {
          element.attachEvent('on' + type, handler);
        };

        removeObserver =  function(element, type, handler) {
          element.detachEvent('on' + type, handler);
        };
      }
      // DOM Level 0
      else {
        addObserver = function(element, type, handler) {
          var attrName = 'on' + type,
           id = Node.getFuseId(element), oldHandler = element[attrName];

          if (oldHandler) {
            if (oldHandler.isDispatcher) return false;
            addCache(id, type, element[attrName]);
          }
          element[attrName] = domData[id].events[type].dispatcher;
        };

        removeObserver = function(element, type, handler) {
          var attrName = 'on' + type;
          if (element[attrName] === handler) {
            element[attrName] = null;
          }
        };

        var __createDispatcher = createDispatcher;
        createDispatcher = function(id, type) {
          var dispatcher = __createDispatcher(id, type);
          dispatcher.isDispatcher = true;
          return dispatcher;
        };
      }
    }

    // avoid Function#wrap for better performance esp.
    // in winLoadWrapper which could be called every 10ms
    domLoadDispatcher = createDispatcher(2, 'dom:loaded');
    addObserver(fuse.get(fuse._doc).raw, 'dom:loaded',
      (getOrCreateCache(2, 'dom:loaded').dispatcher = domLoadWrapper));

    winLoadDispatcher = createDispatcher(1, 'load');
    addObserver(fuse.get(global).raw, 'load',
      (getOrCreateCache(1, 'load').dispatcher = winLoadWrapper));

    /*------------------------------------------------------------------------*/

    plugin.cancel = function cancel() {
      var setCancelled = function() {
        var isCancelled =
        this.isCancelled = Func.TRUE;
      },

      cancel = function cancel() {
        setCancelled.call(this);
        this.raw && this.raw.preventDefault();
      };

      // fired events have no raw
      if (this.raw) {
        // for IE
        if (typeof this.raw.preventDefault === 'undefined') {
          cancel = function cancel() {
            setCancelled.call(this);
            if (this.raw) this.raw.returnValue = false;
          };
        }
        plugin.cancel = cancel;
        this.cancel();
      }
      setCancelled.call(this);
    };

    plugin.stopBubbling = function stopBubbling() {
      var setBubbling = function() {
        this.isBubbling = Func.FALSE;
      },

      stopBubbling = function stopBubbling() {
        setBubbling.call(this);
        this.raw && this.raw.stopPropagation();
      };

      // fired events have no raw
      if (this.raw) {
        // for IE
        if (typeof this.raw.stopPropagation === 'undefined') {
          stopBubbling = function stopBubbling() {
            setBubbling.call(this);
            if (this.raw) this.raw.cancelBubble = true;
          };
        }
        plugin.stopBubbling = stopBubbling;
        this.stopBubbling();
      }
      setBubbling.call(this);
    };

    plugin.getTarget = function getTarget() {
      var setTarget = function(node) {
        var getTarget =
        this.getTarget = function getTarget() { return node; };
        return node;
      },

      getTarget = function getTarget() {
        var type, event = this.raw,
         currentTarget = this.getCurrentTarget(),
         node = currentTarget;

        // fired events have no raw
        if (event) {
          node = event.target;
          type = event.type;

          // Firefox screws up the "click" event when moving between radio buttons
          // via arrow keys. It also screws up the "load" and "error" events on images,
          // reporting the document as the target instead of the original image.
          if (BUGGY_EVENT_TYPES[type] ||
              getNodeName(currentTarget) === 'INPUT' &&
              currentTarget.type === 'radio' && type === 'click') {
            node = currentTarget;
          }
          if (typeof currentTarget.nodeType === 'number') {
            // Fix a Safari bug where a text node gets passed as the target of an
            // anchor click rather than the anchor itself.
            node = fuse.get(node && node.nodeType === TEXT_NODE
              ? node.parentNode
              : node);
          }
          else {
            // force window to return window
            node = currentTarget;
          }
        }

        return setTarget.call(this, node);
      };

      // fired events have no raw
      if (!this.raw) {
        return setTarget.call(this, this.getCurrentTarget());
      }
      if (typeof this.raw.target === 'undefined') {
        getTarget = function getTarget() {
          var event = this.raw,
           currentTarget = this.getCurrentTarget(),
           node = currentTarget;

          if (event && typeof currentTarget.nodeType === 'number') {
            node = fromElement(event.srcElement || currentTarget);
          }
          return setTarget.call(this, node);
        };
      };

      plugin.getTarget = getTarget;
      return this.getTarget();
    };

    plugin.getRelatedTarget = function getRelatedTarget() {
      var setRelatedTarget = function(node) {
        var getRelatedTarget =
        this.getRelatedTarget = function getRelatedTarget() { return node; };
        return node;
      },

      getRelatedTarget = function getRelatedTarget() {
        var node = this.raw && this.raw.relatedTarget;
        if (node) node = fromElement(node);
        return setRelatedTarget.call(this, node);
      };

       // fired events have no raw
      if (!this.raw) {
        return setRelatedTarget.call(this, null);
      }
      // for IE
      if (typeof this.raw.relatedTarget === 'undefined') {
        getRelatedTarget = function getRelatedTarget() {
          var node = null, event = this.raw;
          switch (event && event.type) {
            case 'mouseover': node = fromElement(event.fromElement);
            case 'mouseout':  node = fromElement(event.toElement);
          }
          return setRelatedTarget.call(this, node);
        };
      }

      plugin.getRelatedTarget = getRelatedTarget;
      return this.getRelatedTarget();
    };

    plugin.getPointerX = function getPointerX() {
      return definePointerXY.call(this, 'getPointerX');
    };

    plugin.getPointerY = function getPointerY() {
      return definePointerXY.call(this, 'getPointerY');
    };

    plugin.getPointer = function getPointer() {
      return { 'x': this.getPointerX(), 'y': this.getPageY() };
    };

    plugin.findElement = function findElement(selectors) {
      var match = fuse.dom.selector.match, element = this.getTarget();
      if (!selectors || selectors == null || !element || match(element, selectors)) {
        return element;
      }
      if (element = (element.raw || element).parentNode) {
        do {
          if (element.nodeType === ELEMENT_NODE && match(element, selectors))
            return fromElement(element);
        } while (element = element.parentNode);
      }
      return element;
    };

    plugin.isCancelled =
    plugin.isStopped   = Func.FALSE;
    plugin.isBubbling  = Func.TRUE;

    plugin.isLeftClick = function isLeftClick() {
      return defineIsClick.call(this, 'isLeftClick');
    };

    plugin.isMiddleClick = function isMiddleClick() {
      return defineIsClick.call(this, 'isMiddleClick');
    };

    plugin.isRightClick = function isRightClick() {
      return defineIsClick.call(this, 'isRightClick');
    };

    plugin.stop = function stop() {
      // set so that a custom event can be inspected
      // after the fact to determine whether or not it was stopped.
      this.isStopped = Func.TRUE;
      this.cancel();
      this.stopBubbling();
    };

    /*------------------------------------------------------------------------*/

    Document.plugin.isLoaded = Func.FALSE;

    Document.plugin.fire =
    Element.plugin.fire  =
    Window.plugin.fire   = function fire(type, memo) {
      var backup, checked, dispatcher, ec, data, id, first = true,
       element = this.raw || this,
       attrName = 'on' + type,
       event = Event(null, element);

      event.type = type;
      event.memo = memo || { };

      // change checked state before calling handlers
      if (type === 'click' && getNodeName(element) === 'INPUT' &&
          CHECKED_INPUT_TYPES[element.type]) {
        checked = element.checked;
        element.checked = !checked;
      }

      do {
        id = element.nodeType === ELEMENT_NODE
          ? element[DATA_ID_PROP]
          : Node.getFuseId(element);

        data = id && domData[id];
        ec   = data && data.events && data.events[type];

        // fire DOM Level 0
        if (typeof element[attrName] === 'function' &&
            !element[attrName].isDispatcher) {
          if (element[attrName](event) === false) {
            event.stop();
          }
        }
        // fire DOM Level 2
        if (event.isBubbling() &&
           (dispatcher = ec && ec.dispatcher)) {
          dispatcher(event);
        }
        // default action
        if (first) {
          first = false;

          if (event.isCancelled()) {
            // restore previous checked value
            if (checked != null) {
              element.checked = checked;
            }
          }
          else if (isHostObject(element, type)) {
            // temporarily remove handler so its not triggered
            if (typeof element[attrName] === 'function') {
              backup = element[attrName];
              element[attrName] = null;
            }
            // trigger default action
            element[type]();

            // ensure checked didn't change
            if (checked != null) {
              element.checked = !checked;
            }
            // restore backup
            if (backup) {
              element[attrName] = backup;
            }
          }
        }
        // stop propagating
        if (!event.isBubbling()) {
          break;
        }
      } while (element = element.parentNode);

      return event;
    };

    Document.plugin.observe =
    Element.plugin.observe  =
    Window.plugin.observe   = function observe(type, handler) {
      var element = this.raw || this,
       dispatcher = addCache(Node.getFuseId(element), type, handler);
      if (!dispatcher) return this;

      addObserver(element, type, dispatcher);
      return this;
    };

    Document.plugin.stopObserving =
    Element.plugin.stopObserving  =
    Window.plugin.stopObserving   = function stopObserving(type, handler) {
      var dispatcher, ec, events, foundAt, id, length,
       callee = Element.plugin.stopObserving,
       element = this.raw || this;

      type = isString(type) ? type : null;
      id = Node.getFuseId(element);
      events = domData[id].events;

      if (!events) return this;
      ec = events[type];

      if (ec && handler == null) {
        // If an event name is passed without a handler,
        // we stop observing all handlers of that type.
        length = ec.handlers.length;
        if (!length) {
          callee.call(element, type, 0);
        } else {
          while (length--) callee.call(element, type, length);
        }
        return this;
      }
      else if (!type || type == '') {
        // If both the event name and the handler are omitted,
        // we stop observing _all_ handlers on the element.
        for (type in events) {
          callee.call(element, type);
        }
        return this;
      }

      dispatcher = ec.dispatcher;
      foundAt = isNumber(handler) ? handler : arrIndexOf.call(ec.handlers, handler);

      if (foundAt < 0) return this;
      removeCacheAtIndex(id, type, foundAt);

      if (!events[type]) {
        removeObserver(element, type, dispatcher);
      }
      return this;
    };

    // prevent JScript bug with named function expressions
    var cancel =        nil,
     element =          nil,
     fire =             nil,
     findElement =      nil,
     getPointer  =      nil,
     getPointerX =      nil,
     getPointerY =      nil,
     getRelatedTarget = nil,
     getTarget =        nil,
     isBubbling =       nil,
     isCancelled =      nil,
     isLeftClick =      nil,
     isLoaded =         nil,
     isMiddleClick =    nil,
     isRightClick =     nil,
     isStopped =        nil,
     observe =          nil,
     preventDefault =   nil,
     stop =             nil,
     stopObserving =    nil,
     stopBubbling =     nil;
  })(Event.plugin);

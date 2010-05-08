  /*---------------------------------- EVENT ---------------------------------*/

  fuse.dom.Event = (function() {
    var Decorator = function(event, currTarget) {
      var getCurrentTarget = 
      this.getCurrentTarget = function getCurrentTarget() {
        var getCurrentTarget = function getCurrentTarget() { return currTarget; };
        if (currTarget) currTarget = fromElement(Window(currTarget));
        this.getCurrentTarget = getCurrentTarget;
        return currTarget;
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

    fuse.Class({ 'constructor': Event });
    Decorator.prototype = Event.plugin;

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

    return Event;
  })();

  /*--------------------------------------------------------------------------*/

  (function(Event) {

    var stopObserving,

    BUGGY_EVENT_TYPES = { 'error': 1, 'load': 1 },

    CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 },

    CLICK_MAP  = { 'L': 1, 'M': 2, 'R': 3 },

    CLICK_PROP = 'which',

    EVENT_TYPE_ALIAS = { 'blur': 'delegate:blur', 'focus': 'delegate:focus' },

    plugin = Event.plugin,

    arrIndexOf = fuse.Array.plugin.indexOf.raw,

    defineIsClick = function() {
      var object = this.raw ? plugin : this,

      isLeftClick = function isLeftClick() {
        var event = this.raw;
        return (this.isLeftClick = createGetter('isLeftClick',
          !!event && event[CLICK_PROP] === CLICK_MAP.L))();
      },

      isMiddleClick = function isMiddleClick() {
        var event = this.raw;
        return (this.isMiddleClick = createGetter('isMiddleClick',
          !!event && event[CLICK_PROP] === CLICK_MAP.M))();
      },

      isRightClick = function isRightClick() {
        var event = this.raw;
        return (this.isRightClick = createGetter('isRightClick',
          !!event && event[CLICK_PROP] === CLICK_MAP.R))();
      };

      if (this.raw && typeof this.raw.which === 'number') {
        // simulate a middle click by pressing the Apple key in Safari 2.x
        if (typeof this.raw.metaKey === 'boolean') {
          isMiddleClick = function isMiddleClick() {
            var event = this.raw, which = event && event.which;
            return (this.isMiddleClick = createGetter('isMiddleClick',
              which === CLICK_MAP.L ? event.metaKey : which === CLICK_MAP.M))();
          };
        }
      }
      // for IE
      // check for `button` second for browsers that have `which` and `button`
      // compatibility charts found at http://unixpapa.com/js/mouse.html
      else if (this.raw && typeof this.raw.button === 'number') {
        CLICK_MAP  = { 'L': 1, 'M': 4, 'R': 2 };
        CLICK_PROP = 'button';
      }
      // fallback
      else {
        isLeftClick   = createGetter('isLeftClick',   false);
        isMiddleClick = createGetter('isMiddleClick', false);
        isRightClick  = createGetter('isRightClick',  false);
      }

      object.isLeftClick   = isLeftClick;
      object.isMiddleClick = isMiddleClick;
      object.isRightClick  = isRightClick;

      object = nil;
      return this[arguments[0]]();
    },

    definePointerXY = function() {
      var info = fuse._info,

      doc = getDocument(this.getTarget() || global),

      object = this.raw && doc[info.root.property] &&
        doc[info.scrollEl.property] ? plugin : this,

      // defacto standard
      getPointerX = function getPointerX() {
        return (this.getPointerX = createGetter('getPointerX',
          this.raw && this.raw.pageX || 0))();
      },

      getPointerY = function getPointerY() {
        return (this.getPointerY = createGetter('getPointerY',
          this.raw && this.raw.pageY || 0))();
      };

      // fired events have no raw
      if (!this.raw) {
        getPointerX = createGetter('getPointerX', 0);
        getPointerY = createGetter('getPointerY', 0);
      }
      // IE and others
      if (typeof this.raw.pageX !== 'number') {
        getPointerX = function getPointerX() {
          var doc, root, scrollEl, x = 0;
          if (this.raw) {
            doc = getDocument(this.getTarget() || global);
            root = doc[info.root.property];
            scrollEl = doc[info.scrollEl.property];
            x = this.raw.clientX + scrollEl.scrollLeft - root.clientLeft;
            if (x < 0) x = 0;
          }
          this.getPointerX = createGetter('getPointerX', x);
          return x;
        };

        getPointerY = function getPointerY() {
          var doc, root, scrollEl, y = 0;
          if (this.raw) {
            doc = getDocument(this.getTarget() || global);
            root = doc[info.root.property];
            scrollEl = doc[info.scrollEl.property];
            y = this.raw.clientY + scrollEl.scrollTop - root.clientTop;
            if (y < 0) y = 0;
          }
          this.getPointerY = createGetter('getPointerY', y);
          return y;
        };
      }

      object.getPointerX = getPointerX;
      object.getPointerY = getPointerY;

      doc = object = nil;
      return this[arguments[0]]();
    },

    addCache = function(id, type, handler) {
      // bail if handler is already exists
      var ec = getOrCreateCache(id, type);
      if (arrIndexOf.call(ec.handlers, handler) > -1) {
        return false;
      }
      ec.handlers.unshift(handler);
      return ec.dispatcher ? false : (ec.dispatcher = Event.createDispatcher(id, type));
    },

    addObserver = function(element, type, handler) {
      element.addEventListener(type, handler, false);
    },

    createGetter = function(name, value) {
      return Function('v', 'function ' + name + '(){return v;} return ' + name)(value);
    },

    getOrCreateCache = function(id, type) {
      var data = domData[id], events = data.events || (data.events = { });
      return events[type] || (events[type] = { 'handlers': [], 'dispatcher': false });
    },

    removeObserver = function(element, type, handler) {
      element.removeEventListener(type, handler, false);
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
            if (oldHandler._isDispatcher) return false;
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
      }
    }

    /*------------------------------------------------------------------------*/

    plugin.cancel = function cancel() {
      var setCancelled = function(object) {
        object.isCancelled = createGetter('isCancelled', true);
      },

      cancel = function cancel() {
        setCancelled(this);
        this.raw && this.raw.preventDefault();
      };

      // fired events have no raw
      if (this.raw) {
        // for IE
        if (typeof this.raw.preventDefault === 'undefined') {
          cancel = function cancel() {
            setCancelled(this);
            if (this.raw) this.raw.returnValue = false;
          };
        }
        plugin.cancel = cancel;
        this.cancel();
      }
      setCancelled(this);
    };

    plugin.stopBubbling = function stopBubbling() {
      var setBubbling = function(object) {
        object.isBubbling = createGetter('isBubbling', false);
      },

      stopBubbling = function stopBubbling() {
        setBubbling(this);
        this.raw && this.raw.stopPropagation();
      };

      // fired events have no raw
      if (this.raw) {
        // for IE
        if (typeof this.raw.stopPropagation === 'undefined') {
          stopBubbling = function stopBubbling() {
            setBubbling(this);
            if (this.raw) this.raw.cancelBubble = true;
          };
        }
        plugin.stopBubbling = stopBubbling;
        this.stopBubbling();
      }
      setBubbling(this);
    };

    plugin.getTarget = function getTarget() {
      var setTarget = function(object, value) {
        object.getTarget = createGetter('getTarget', value);
        return value;
      },

      getTarget = function getTarget() {
        var currRaw, type,
         event = this.raw,
         currTarget = this.getCurrentTarget(),
         node = currTarget;

        if (event) {
          currRaw = currTarget.raw || currTarget;
          node = event.target || currTarget;
          type = event.type;

          // 1) Firefox screws up the "load" and "error" events on images
          // 2) Firefox also screws up the "click" event when
          //    moving between radio buttons via arrow keys.
          // 3) Force window to return window
          if (BUGGY_EVENT_TYPES[type] ||
              (getNodeName(currRaw) === 'INPUT' &&
              currRaw.type === 'radio' && type === 'click') ||
              currRaw == getWindow(currRaw)) {
            node = currTarget;
          }
          // Fix a Safari bug where a text node gets passed as the target of an
          // anchor click rather than the anchor itself.
          else if (node.nodeType === TEXT_NODE) {
            node = node.parentNode;
          }
          node = fromElement(node);
        }
        return setTarget(this, node);
      };

      // fired events have no raw
      if (!this.raw) {
        return setTarget(this, this.getCurrentTarget());
      }
      if (typeof this.raw.target === 'undefined') {
        getTarget = function getTarget() {
          var node, event = this.raw;
          if (event && (node = event.srcElement)) {
            node = fromElement(node);
          }
          if (!node) {
            node = this.getCurrentTarget();
          }
          return setTarget(this, node);
        };
      };

      plugin.getTarget = getTarget;
      return this.getTarget();
    };

    plugin.getRelatedTarget = function getRelatedTarget() {
      var setRelatedTarget = function(object, value) {
        object.getRelatedTarget = createGetter('getRelatedTarget', value);
        return value;
      },

      getRelatedTarget = function getRelatedTarget() {
        var node = this.raw && this.raw.relatedTarget;
        return setRelatedTarget(this, node && fromElement(node));
      };

      // fired events have no raw
      if (!this.raw) {
        return setRelatedTarget(this, null);
      }
      // for IE
      if (typeof this.raw.relatedTarget === 'undefined') {
        getRelatedTarget = function getRelatedTarget() {
          var node = null, event = this.raw;
          switch (event && event.type) {
            case 'mouseover': node = fromElement(event.fromElement);
            case 'mouseout':  node = fromElement(event.toElement);
          }
          return setRelatedTarget(this, node);
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

    plugin.findElement = function findElement(selectors, untilElement) {
      var match = fuse.dom.selector.match, element = this.getTarget();
      if (selectors == null || selectors == '' || !element || match(element, selectors)) {
        return element;
      }
      if (element = (element.raw || element).parentNode) {
        do {
          if (element === untilElement)
            break;
          if (element.nodeType === ELEMENT_NODE && match(element, selectors))
            return fromElement(element);
        } while (element = element.parentNode);
      }
      return null;
    };

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
      this.isStopped = createGetter('isStopped', true);
      this.cancel();
      this.stopBubbling();
    };

    plugin.isCancelled = createGetter('isCancelled', false);
    plugin.isStopped   = createGetter('isStopped',   false);
    plugin.isBubbling  = createGetter('isBubbling',  true);

    /*------------------------------------------------------------------------*/

    Document.plugin.isLoaded = createGetter('isLoaded', false);

    Document.plugin.fire =
    Element.plugin.fire  =
    Window.plugin.fire   = function fire(type, memo, event) {
      var backup, checked, dispatcher, ec, data, id,
       first    = true,
       element  = this.raw || this,
       attrName = 'on' + type;

      event = Event(event || null, element);
      event.type = type && String(type);
      event.memo = memo || event.memo || { };

      // change checked state before calling handlers
      if (type === 'click' && getNodeName(element) === 'INPUT' &&
          CHECKED_INPUT_TYPES[element.type]) {
        checked = element.checked;
        element.checked = !checked;
      }

      do {
        id   = element.nodeType === ELEMENT_NODE ? element[DATA_ID_PROP] : Node.getFuseId(element);
        data = id && domData[id];
        ec   = data && data.events && data.events[type];

        // fire DOM Level 0
        if (typeof element[attrName] === 'function' &&
            !element[attrName]._isDispatcher) {
          // stop event if handler result is false
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
          else if (isHostType(element, type)) {
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

    stopObserving =
    Document.plugin.stopObserving =
    Element.plugin.stopObserving  =
    Window.plugin.stopObserving   = function stopObserving(type, handler) {
      var ec, foundAt, length,
       element = this.raw || this,
       id      = Node.getFuseId(this),
       events  = domData[id].events;

      if (!events)return this;
      type = isString(type) ? type && String(type) : null;

      // if the event type is omitted we stop
      // observing all handlers on the element
      if (!type) {
        eachKey(events, function(handlers, type) {
          stopObserving.call(element, type);
        });
        return this;
      }
      if (ec = events[type]) {
        // if the handler is omitted we stop
        // observing all handlers of that type
        if (handler == null) {
          length = ec.handlers.length;
          while (length--) stopObserving.call(element, type, length);
          return this;
        }
      } else {
        return this;
      }

      if (isNumber(handler)) {
        // bail if handler is a delegator
        foundAt = handler;
        if (ec.handlers[foundAt]._delegatee) {
          foundAt = -1;
        }
      } else {
        foundAt = arrIndexOf.call(ec.handlers, handler);
      }

      if (foundAt < 0) return this;

      // remove handler
      ec.handlers.splice(foundAt, 1);

      // if no more handlers and not bubbling for
      // delegation then remove the event type data and dispatcher
      if (!ec.handlers.length && !ec._bubbleForDelegation) {
        removeObserver(element, type, ec.dispatcher);
        delete events[type];
      }
      return this;
    };

    // prevent JScript bug with named function expressions
    var cancel =        nil,
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
     stopBubbling =     nil;
  })(fuse.dom.Event);

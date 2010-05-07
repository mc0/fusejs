  /*---------------------------- EVENT: DELEGATE -----------------------------*/

  (function(plugin) {

    var BUTTON_EVENTS = { 'reset': 1, 'submit': 1 },

    EVENT_TYPE_ALIAS = { 'blur': 'delegate:blur', 'focus': 'delegate:focus' },

    REAL_EVENT_TYPE = { 'delegate:blur': 'blur', 'delegate:focus': 'focus' },

    NON_BUBBLING_EVENTS = {
      'change': 1,
      'reset':  1,
      'submit': 1,
      'delegate:blur':  1,
      'delegate:focus': 1
    },

    PROBLEM_ELEMENTS = {
      'LABEL':    1,
      'BUTTON':   1,
      'INPUT':    1,
      'SELECT':   1,
      'TEXTAREA': 1
    },

    addWatcher = NOOP,

    removeWatcher = NOOP,

    addBubbler = function(element, id, type) {
      // initialize event type data if it isn't
      var events = domData[id] && domData[id].events;
      if (!events || !events[type]) {
        // observe a dummy handler to create the dispatcher
        fuse(element).observe(type, NOOP);
        // remove dummy handler while keeping the array intact
        (events || (events = domData[id].events))[type].handlers.length = 0;
      }
      // flag event system to manually bubble after all the
      // element's handlers for the event type have been executed 
      events[type]._bubbleForDelegation = true;
    },

    createHandler = function(selector, delegatee) {
      return function(event) {
        var type, target = event.findElement(selector, this.raw || this);
        if (target) {
          type = event.type;
          event.type = REAL_EVENT_TYPE[type] || type;
          return delegatee.call(target, event, target);
        }
      };
    },

    onBeforeActivate = function() {
      var id, data, type,
       target = global.event.srcElement,
       nodeName = target && getNodeName(target);

      // ensure we patch the elements event data only once
      if (PROBLEM_ELEMENTS[nodeName]) {
        id = Node.getFuseId(target);
        data = domData[id];
        if (!data._patchedForDelegation) {
          if (nodeName !== 'LABEL') {
            // bubble change/reset/submit
            if (!BUTTON_EVENTS[type = target.type]) {
              type = 'change';
            }
            addBubbler(target, id, type);
          }
          addBubbler(target, id, 'blur');
          addBubbler(target, id, 'focus');
          data._patchedForDelegation = true;
        }
      }
    },

    onCapture = function(event) {
      var data, id, target = (event.raw || event).target;
      if (PROBLEM_ELEMENTS[getNodeName(target)]) {
        id = Node.getFuseId(target);
        data = domData[id];
        if (!data._patchedForDelegation) {
          addBubbler(target, id, 'blur');
          addBubbler(target, id, 'focus');
          data._patchedForDelegation = true;
        }
      }
    };

    // DOM Level 2
    if (envTest('ELEMENT_ADD_EVENT_LISTENER')) {
      addWatcher = function(element) {
        element.addEventListener('focus', onCapture, true);
      };

      removeWatcher = function(element) {
        element.removeEventListener('focus', onCapture, true);
      };
    }
    // JScript
    else if (envTest('ELEMENT_ATTACH_EVENT')) {
      addWatcher = function(element) {
        element.attachEvent('onbeforeactivate', onBeforeActivate);
      };

      removeWatcher = function(element) {
        element.detachEvent('onbeforeactivate', onBeforeActivate);
      };
    }

    plugin.delegate          =
    Document.plugin.delegate =
    Window.plugin.delegate   = function delegate(type, selector, delegatee) {
      var ec, handler, handlers, i = -1,
       element = this.raw || this,
       id      = Node.getFuseId(this),
       data    = domData[id],
       events  = data.events;

      // juggle arguments
      if (typeof selector === 'function') {
        delegatee = selector;
        selector = null;
      }

      type = EVENT_TYPE_ALIAS[type] || type;
      selector && (selector = String(selector));

      // ensure it isn't in the stack already
      if (events && (ec = events[type])) {
        handlers = ec.handlers;
        while (handler = handlers[++i]) {
          if (handler._delegatee === delegatee && handler._selector === selector) {
            return this;
          }
        }
      }

      // indicate handler is a delegator and pass to Element#observe
      handler = selector ? createHandler(selector, delegatee) : delegatee;
      handler._delegatee = delegatee;
      handler._selector  = selector;

      plugin.observe.call(this, type, handler);

      // add a watcher for non-bubbling events to signal
      // the event system when manual bubbling is needed
      if (NON_BUBBLING_EVENTS[type]) {
        id = Node.getFuseId(this);
        data = domData[id];
        if (!data._watchForDelegation) {
          addWatcher(element);
          data._watchForDelegation = true;
        }
      }
      return this;
    };

    plugin.stopDelegating          =
    Document.plugin.stopDelegating =
    Window.plugin.stopDelegating   = function stopDelegating(type, selector, delegatee) {
      var ec, handler, handlers, i = -1,
       element = this.raw || this,
       isEmpty = true,
       id      = Node.getFuseId(this),
       data    = domData[id];
       events  = data.events;

      if (!events) return this;
      if (!isString(type)) type = null;

      type = EVENT_TYPE_ALIAS[type] || type && String(type);
      selector && (selector = String(selector));

      // if the event type is omitted we stop
      // observing all delegatees on the element
      if (!type) {
        eachKey(events, function(handlers, type) {
          plugin.stopDelegating.call(element, type);
        });
        return this;
      }
      if (ec = events[type]) {
        handlers = ec.handlers;

        // if told exactly which delegatee to remove
        if (isNumber(delegatee)) {
          plugin.stopObserving.call(this, type, delegatee);
        }
        else if (selector) {
          // if nothing is omitted
          if (delegatee) {
            while (handler = handlers[++i]) {
              if (handler._delegatee === delegatee && handler._selector === selector) {
                plugin.stopObserving.call(this, type, handler);
                break;
              }
            }
          }
          // if the handler is omitted we stop observing
          // all delegatees of that type and selector
          else {
            while (handler = handlers[++i]) {
              if (handler._selector === selector) {
                delete handler._delegatee;
                stopDelegating.call(this, type, selector, i);
              }
            }
            return this;
          }
        }
        // if the selector is omitted we stop
        // observing all delegatees of that type
        else {
          while (handler = handlers[++i]) {
            if (handler._delegatee) {
              delete handler._delegatee;
              stopDelegating.call(this, type, null, i);
            }
          }
          return this;
        }
      } else  {
        return this;
      }

      // detect if event data is empty
      eachKey(events, function(handlers) {
        if (handlers.length) return (isEmpty = false);
      });

      // if no handlers for any events then remove the watcher
      if (isEmpty) {
        removeWatcher(element);
        delete data._watchForDelegation;
      }
      return this;
    };

    // prevent JScript bug with named function expressions
    var delegate = nil;
  })(Element.plugin);

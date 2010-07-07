  /*---------------------------- EVENT: DELEGATE -----------------------------*/

  (function(plugin) {

    var BUTTON_TYPES    = { 'image': 1, 'reset': 1, 'submit': 1 },

    EVENT_TYPE_ALIAS    = { 'blur': 'delegate:blur', 'focus': 'delegate:focus' },

    REAL_EVENT_TYPE     = { 'delegate:blur': 'blur', 'delegate:focus': 'focus' },

    CHANGEABLE_ELEMENTS = { 'INPUT': 1, 'SELECT': 1, 'TEXTAREA': 1 },

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

    Event = fuse.dom.Event,

    addDispatcher = Event._addDispatcher,

    addWatcher = NOOP,

    removeWatcher = NOOP,

    getFuseId = Node.getFuseId,

    addBubbler = function(element, id, type) {
      // initialize event type data if it isn't
      var events = domData[id] && domData[id].events;
      if (!events || !events[type]) {
        addDispatcher(element, type, null, id);
        events = domData[id].events;
      }
      // flag event system to manually bubble after all the
      // element's handlers for the event type have been executed 
      events[type]._isBubblingForDelegation = true;
    },

    createHandler = function(selector, delegatee) {
      // normal usage
      if (selector) {
        return function(event) {
          var type, match = event.findElement(selector, this.raw || this);
          if (match) {
            type = event.type;
            if (type = REAL_EVENT_TYPE[type]) {
              event.type = type;
              event.stopBubbling();
            }
            event.getDelegator = createGetter('getDelegator', this);
            event.getCurrentTarget = createGetter('getCurrentTarget', match);
            return delegatee.call(match, event);
          }
        };
      }
      // power usage
      return function(event) {
        type = event.type;
        if (type = REAL_EVENT_TYPE[type]) {
          event.type = type;
          event.stopBubbling();
        }
        return delegatee.call(this, event);
      };
    },

    // for IE
    onBeforeActivate = function() {
      var id, data, form, type,
       target = global.event.srcElement,
       nodeName = target && getNodeName(target);

      // ensure we patch the elements event data only once
      if (PROBLEM_ELEMENTS[nodeName]) {
        id = getFuseId(target);
        data = domData[id];
        if (!data._isPatchedForDelegation) {
          // form controls
          if (nodeName !== 'FORM') {
            if (CHANGEABLE_ELEMENTS[nodeName] && !BUTTON_TYPES[target.type]) {
              addBubbler(target, id, 'change');
            }
            addBubbler(target, id, 'blur');
            addBubbler(target, id, 'focus');
            data._isPatchedForDelegation = true;
          }
          // form element
          if (form = target.form || target) {
            if (form !== target) {
              id   = getFuseId(form);
              data = domData[id];
            }
            if (!data._isPatchedForDelegation) {
              addBubbler(form, id, 'reset');
              addBubbler(form, id, 'submit');
              data._isPatchedForDelegation = true;
            }
          }
        }
      }
    },

    // for others
    onCapture = function(event) {
      var data, id, target = (event.raw || event).target;
      if (PROBLEM_ELEMENTS[getNodeName(target)]) {
        id = getFuseId(target);
        data = domData[id];
        if (!data._isPatchedForDelegation) {
          addBubbler(target, id, 'blur');
          addBubbler(target, id, 'focus');
          data._isPatchedForDelegation = true;
        }
      }
    };

    // DOM Level 2
    if (envTest('ELEMENT_ADD_EVENT_LISTENER')) {
      addWatcher = function(element, data) {
        element.addEventListener('focus', onCapture, true);
        (data || domData[getFuseId(element)])._isWatchingDelegation = true;
      };

      removeWatcher = function(element, data) {
        element.removeEventListener('focus', onCapture, true);
        delete (data || domData[getFuseId(element)])._isWatchingDelegation;
      };
    }
    // JScript
    else if (envTest('ELEMENT_ATTACH_EVENT')) {
      PROBLEM_ELEMENTS.FORM = 1;

      addWatcher = function(element, data) {
        element.attachEvent('onbeforeactivate', onBeforeActivate);
        (data || domData[getFuseId(element)])._isWatchingDelegation = true;
      };

      removeWatcher = function(element, data) {
        element.detachEvent('onbeforeactivate', onBeforeActivate);
        delete (data || domData[getFuseId(element)])._isWatchingDelegation;
      };
    }

    plugin.delegate          =
    Document.plugin.delegate =
    Window.plugin.delegate   = function delegate(type, selector, delegatee) {
      var docId, ec, handler, handlers, i = -1,
       element = this.raw || this,
       id      = getFuseId(this),
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
      handler = createHandler(selector, delegatee);
      handler._delegatee = delegatee;
      handler._selector  = selector;

      plugin.observe.call(this, type, handler);

      // if not already watching on the element, add a watcher for
      // non-bubbling events to signal the event system when manual
      // bubbling is needed
      if (NON_BUBBLING_EVENTS[type] && !data._isWatchingDelegation) {
        addWatcher(element, data);
      }
      return this;
    };

    plugin.stopDelegating          =
    Document.plugin.stopDelegating =
    Window.plugin.stopDelegating   = function stopDelegating(type, selector, delegatee) {
      var ec, handler, handlers, i = -1,
       element = this.raw || this,
       isEmpty = true,
       id      = getFuseId(this),
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
        // bail when no event data
        return this;
      }

      // detect if event data is empty
      eachKey(events, function(handlers) {
        if (handlers.length) return (isEmpty = false);
      });

      // if no handlers for any events then remove the watcher
      if (isEmpty) {
        removeWatcher(element, data);
      }
      return this;
    };

    // expose implied private method
    Event._addWatcher = addWatcher;

    // prevent JScript bug with named function expressions
    var delegate = null, stopDelegating = null;
  })(Element.plugin);

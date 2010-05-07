  /*--------------------------- EVENT: DISPATCHER ----------------------------*/

  fuse.dom.Event.createDispatcher = (function() {
    var EVENT_TYPE_ALIAS = { 'blur': 'delegate:blur', 'focus': 'delegate:focus' },

    slice = [].slice,

    // This pattern, based on work by Dean Edwards and John Resig and allows a
    // handler to error out without stopping the other handlers from firing.
    // http://groups.google.com/group/jquery-dev/browse_thread/thread/2a14c2da6bcbb5f
    dispatch = function(length, handlers, decorator, event) {
      var error;
      try {
        while (length--) {
          // stop event if handler result is false
          if (handlers[length].call(decorator, event, decorator) === false) {
            event.stop();
          }
        }
      } catch (e) {
        error = e;
        dispatch(length, handlers, decorator, event);
      } finally {
        if (error) throw error;
      }
    },

    // Event dispatchers manage several handlers and ensure
    // FIFO execution order. They are attached as the primary event
    // listener and execute all handlers they manage.
    createDispatcher = function(id, type) {
      return function(event) {
        // shallow copy handlers to avoid issues with nested observe/stopObserving
        var parentNode,
         data      = global.fuse.dom.data[id],
         decorator = data.decorator,
         node      = decorator.raw || decorator,
         ec        = data.events[type],
         handlers  = slice.call(ec.handlers, 0);

        event = global.fuse.dom.Event(event || getWindow(node).event, decorator);
        dispatch(handlers.length, handlers, decorator, event);

        // bubble if flagged by delegation
        if (ec._bubbleForDelegation && event.isBubbling() &&
            (parentNode = node.parentNode)) {
          // cancel real bubbling
          event.stopBubbling();
          // fake out and set it to bubbling
          event.isBubbling = fuse.Function.TRUE;
          // start manual bubbling
          decorator.fire.call(parentNode, EVENT_TYPE_ALIAS[type] || type, null, event);
        }
      };
    };

    // JScript
    if (!fuse.env.test('ELEMENT_ADD_EVENT_LISTENER') &&
        !fuse.env.test('ELEMENT_ATTACH_EVENT')) {
      var __createDispatcher = createDispatcher;
      createDispatcher = function(id, type) {
        var dispatcher = __createDispatcher(id, type);
        dispatcher._isDispatcher = true;
        return dispatcher;
      };
    }
    return createDispatcher;
  })();

  fuse(fuse._doc).observe('dom:loaded', fuse.Function.NOOP);
  fuse(global).observe('load', fuse.Function.NOOP);

  // ensure that the dom:loaded event has finished executing its observers
  // before allowing the window onload event to proceed
  (function(ec) {
    var __dispatcher = ec.dispatcher;
    ec.dispatcher = function(event) {
      event || (event = global.event);
      var domData = fuse.dom.data;

      if (!fuse.dom.Document(fuse._doc).isLoaded()) {
        domData[2].events['dom:loaded'].dispatcher(event);
      } else if (domData[2] && domData[2].events['dom:loaded']) {
        return setTimeout(function() { ec.dispatcher(event); }, 10);
      }

      event = fuse.dom.Event(event, global);
      event.type = 'load';

      __dispatcher(event);
      fuse(global).stopObserving('load');
    };
  })(fuse.dom.data[1].events.load);

  (function(ec) {
    var __dispatcher = ec.dispatcher;
    ec.dispatcher = function(event) {
      var doc = fuse._doc, docEl = fuse._docEl, decorated = fuse(doc);

      if (!decorated.isLoaded()) {
        // define pseudo private body and root properties
        fuse._body     =
        fuse._scrollEl = doc.body;
        fuse._root     = docEl;

        if (fuse.env.test('BODY_ACTING_AS_ROOT')) {
          fuse._root = doc.body;
          fuse._info.root = fuse._info.body;
        }
        if (fuse.env.test('BODY_SCROLL_COORDS_ON_DOCUMENT_ELEMENT')) {
          fuse._scrollEl = docEl;
          fuse._info.scrollEl = fuse._info.docEl;
        }

        event = fuse.dom.Event(event || global.event, doc);
        event.type = 'dom:loaded';

        decorated.isLoaded = fuse.Function.TRUE;
        __dispatcher(event);
        decorated.stopObserving('DOMContentLoaded').stopObserving('dom:loaded');
      }
    };
  })(fuse.dom.data[2].events['dom:loaded']);

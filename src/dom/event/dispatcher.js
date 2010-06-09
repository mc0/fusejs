  /*--------------------------- EVENT: DISPATCHER ----------------------------*/

  // Seperate from primary closure to avoid memory leaks in IE6

  var addDispatcher = fuse.dom.Event._addDispatcher,
   createGetter = fuse.dom.Event._createGetter;

  // Event dispatchers manage several handlers and ensure
  // FIFO execution order. They are attached as the primary event
  // listener and execute all handlers they manage.
  fuse.dom.Event._createDispatcher = (function() {

    var EVENT_TYPE_ALIAS = { 'blur': 'delegate:blur', 'focus': 'delegate:focus' },

    slice = [].slice,

    createDispatcher = function createDispatcher(id, type) {
      return function(event) {
        // shallow copy handlers to avoid issues with nested observe/stopObserving
        var error, msg, parentNode,
         errors    = [],
         data      = fuse.dom.data[id],
         decorator = data.decorator,
         node      = decorator.raw || decorator,
         ec        = data.events[type],
         handlers  = slice.call(ec.handlers, 0),
         length    = handlers.length;

        event = fuse.dom.Event(event || getWindow(node).event, decorator);
        while (length--) {
          // This pattern, based on work by Dean Edwards, John Resig, and MochiKit
          // allows a handler to error out without stopping the other handlers from firing.
          // http://groups.google.com/group/jquery-dev/browse_thread/thread/2a14c2da6bcbb5f
          try {
            // stop event if handler result is false
            if (handlers[length].call(decorator, event) === false) {
              event.stop();
            }
          } catch (e) {
            errors.push(e);
          }
        }

        // bubble if flagged by delegation
        if (ec._isBubblingForDelegation && event.isBubbling() &&
            (parentNode = node.parentNode)) {
          // cancel real bubbling
          event.stopBubbling();
          // fake out and set it to bubbling
          event.isBubbling = createGetter('isBubbling', true);
          // start manual bubbling
          decorator.fire.call(parentNode, EVENT_TYPE_ALIAS[type] || type, null, event);
        }

        // re-throw errors
        if (length = errors.length) {
          if (length > 1) {
            // use msg to cleanup line number of reported error
            msg = 'Multiple errors thrown while handling the "' + type + '" event' +
              (decorator.inspect ? ' for the ' + decorator.inspect() + ' element' : '') +
              ', see errors property';
            (error = new Error(msg)).errors = errors;
          } else {
            error = errors[0];
          }
          throw error;
        }
      };
    };

    // DOM Level 0
    if (!fuse.env.test('ELEMENT_ADD_EVENT_LISTENER') &&
        !fuse.env.test('ELEMENT_ATTACH_EVENT')) {
      var __createDispatcher = createDispatcher;
      createDispatcher = function createDispatcher(id, type) {
        var dispatcher = __createDispatcher(id, type);
        dispatcher._isDispatcher = true;
        return dispatcher;
      };
    }
    return createDispatcher;
  })();

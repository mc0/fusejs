  /*--------------------------- EVENT: DISPATCHER ----------------------------*/

  // Seperate from primary closure to avoid memory leaks in IE6

  var createGetter = function(name, value) {
    return Function('v', 'function ' + name + '(){return v;} return ' + name)(value);
  };

  fuse.dom.Event.createDispatcher = (function() {

    var EVENT_TYPE_ALIAS = { 'blur': 'delegate:blur', 'focus': 'delegate:focus' },

    slice = [].slice,

    // Event dispatchers manage several handlers and ensure
    // FIFO execution order. They are attached as the primary event
    // listener and execute all handlers they manage.
    createDispatcher = function(id, type) {
      return function(event) {
        // shallow copy handlers to avoid issues with nested observe/stopObserving
        var error, msg, parentNode,
         errors    = [],
         data      = global.fuse.dom.data[id],
         decorator = data.decorator,
         node      = decorator.raw || decorator,
         ec        = data.events[type],
         handlers  = slice.call(ec.handlers, 0),
         length    = handlers.length;

        event = global.fuse.dom.Event(event || getWindow(node).event, decorator);
        while (length--) {
          // This pattern, based on work by Dean Edwards, John Resig and MochiKit allows a
          // handler to error out without stopping the other handlers from firing.
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
        if (ec._bubbleForDelegation && event.isBubbling() &&
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

  // observe using a dummy handler to indirectly create the event dispatchers
  // and later remove the dummy handler while keeping the handlers array intact
  fuse(fuse._doc).observe('dom:loaded', fuse.Function.NOOP);
  fuse(global).observe('load', fuse.Function.NOOP);

  // ensure that the dom:loaded event has finished executing its observers
  // before allowing the window onload event to proceed
  (function(ec) {
    var __dispatcher = ec.dispatcher;
    ec.dispatcher = function(event) {
      event || (event = global.event);
      var domData = fuse.dom.data;

      // make dom:loaded dispatch if it hasn't
      if (!fuse.dom.Document(fuse._doc).isLoaded()) {
        domData[2].events['dom:loaded'].dispatcher(event);
      }
      // try again later if dom:loaded is still executing handlers
      else if (domData[2] && domData[2].events['dom:loaded']) {
        return setTimeout(function() { ec.dispatcher(event); }, 10);
      }
      // prepare event wrapper
      event = fuse.dom.Event(event, global);
      event.type = 'load';
      __dispatcher(event);

      // clear event cache
      fuse(global).stopObserving('load');
    };

    // remove dummy handler
    ec.handlers.length = 0;
  })(fuse.dom.data[1].events.load);

  // perform feature tests and define pseudo private
  // body/root properties when the dom is loaded
  (function(ec) {
    var __dispatcher = ec.dispatcher;
    ec.dispatcher = function(event) {
      var doc = fuse._doc, docEl = fuse._docEl, decorated = fuse(doc);
      if (!decorated.isLoaded()) {
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

        decorated.isLoaded = createGetter('isLoaded', true);
        __dispatcher(event);
        decorated.stopObserving('DOMContentLoaded').stopObserving('dom:loaded');
      }
    };

    // remove dummy handler
    ec.handlers.length = 0;
  })(fuse.dom.data[2].events['dom:loaded']);

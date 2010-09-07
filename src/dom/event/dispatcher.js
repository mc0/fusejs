  /*--------------------------- EVENT: DISPATCHER ----------------------------*/

  // Seperate from primary closure to avoid memory leaks in IE6

  // Event dispatchers manage several handlers and ensure
  // FIFO execution order. They are attached as the primary event
  // listener and execute all handlers they manage.
  fuse.dom.Event._createDispatcher = (function() {

    var EVENT_TYPE_ALIAS =
      { 'blur': 'delegate:blur', 'focus': 'delegate:focus' },

    huid = fuse.uid + '_domHandler',

    runScriptText = fuse.dom.runScriptText,

    createDispatcher = function createDispatcher(id, type) {
      return function(event) {
        var decorator, handler, parentNode, node, stopped, i = -1,
         debug     = fuse.debug,
         data      = fuse.dom.data[id],
         decorator = data.decorator,
         ec        = data.events[type],
         handlers  = ec.handlers.slice(0);

        decorator || (decorator = fuse(data.raw));
        node = decorator.raw;
        event = fuse.dom.Event(event || getWindow(node).event, decorator);

        while (handler = handlers[++i]) {
          if (debug) {
            // script injection allows handlers to fail without halting the while loop
            fuse[huid] = function() { handler.call(decorator, event) };
            stopped = runScriptText('fuse.' + huid + '()') === false;
            delete fuse[huid];
          } else {
            stopped = handler.call(decorator, event);
          }
          stopped && event.stop();
        }

        // bubble if flagged by delegation
        if (ec._isBubblingForDelegation && event.isBubbling() &&
            (parentNode = node.parentNode)) {
          // cancel real bubbling
          event.stopBubbling();
          // fake out and set it to bubbling
          event.isBubbling = fuse.dom.Event._createGetter('isBubbling', true);
          // start manual bubbling
          decorator.fire.call(parentNode, EVENT_TYPE_ALIAS[type] || type, null, event);
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

    delete fuse.uid;
    return createDispatcher;
  })();

  /*--------------------------------------------------------------------------*/

  (function(Event) {

    var addDispatcher = Event._addDispatcher,

    createGetter      = Event._createGetter,

    createDispatcher  = Event._createDispatcher,

    domLoadDispatcher = createDispatcher(1, 'dom:loaded'),

    winLoadDispatcher = createDispatcher(0, 'load'),

    fixReadyState     = typeof fuse._doc.readyState != 'string',
    
    domLoadWrapper = function(event) {
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
        // fixed for Firefox < 3.6
        if (fixReadyState) {
          doc.readyState = 'interactive';
        }

        event = Event(event || window.event, doc);
        event.type = 'dom:loaded';

        decorated.isLoaded = createGetter('isLoaded', true);
        domLoadDispatcher(event);
        decorated.stopObserving('DOMContentLoaded').stopObserving('dom:loaded');
        delete fuse.dom.data[1].events['dom:loaded'];
      }
    },

    winLoadWrapper = function(event) {
      event || (event = window.event);
      var doc = fuse._doc;

      // make dom:loaded dispatch if it hasn't
      if (!fuse(doc).isLoaded()) {
        domLoadWrapper(event);
      }
      // try again later if dom:loaded is still executing handlers
      else if (fuse.dom.data[1].events['dom:loaded']) {
        return setTimeout(function() { winLoadWrapper(event); }, 10);
      }
      // fixed for Firefox < 3.6
      if (fixReadyState) {
        doc.readyState = 'complete';
      }

      // prepare event wrapper
      event = Event(event, window);
      event.type = 'load';
      winLoadDispatcher(event);

      // clear event cache
      fuse(window).stopObserving('load');
    };

    // fixed for Firefox < 3.6
    if (fixReadyState) {
      fuse._doc.readyState = 'loading';
    }

    // Ensure that the dom:loaded event has finished executing its observers
    // before allowing the window onload event to proceed
    addDispatcher(fuse._doc, 'dom:loaded', domLoadWrapper);

    // Perform feature tests and define pseudo private
    // body/root properties when the dom is loaded
    addDispatcher(window, 'load', winLoadWrapper);
  })(fuse.dom.Event);

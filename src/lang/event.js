  /*------------------------------ LANG: EVENT -------------------------------*/

  fuse.Class.mixins.event = (function() {

    var huid = fuse.uid + '_eventHandler';

    function createDispatcher(type) {
      return function() {
        var handler, i = -1, debug = fuse.debug,
         klass = this, args = arguments, ec = klass._events.events[type],
         handlers = ec && ec.handlers;

        if (handlers) {
          handlers = handlers.slice(0);
          while (handler = handlers[++i]) {
            if (debug) {
              // script injection allows handlers to fail without halting the while loop
              fuse[huid] = function() { handler.apply(klass, args) };
              fuse.dom.runScriptText('fuse.' + huid + '()');
              delete fuse[huid];
            }
            else {
              handler.apply(klass, args);
            }
          }
        }
      };
    }

    function fire(type) {
      var ec, data = this._events;
      if (data && (ec = data.events[type])) {
        ec.dispatcher.apply(this, Array.prototype.slice.call(arguments, 1))
      }
      return this;
    }

    function observe(type, handler) {
      var data = this._events || (this._events = { 'createDispatcher': createDispatcher, 'events': { } }),
       ec = (data.events[type] || data.events[type] = { 'handlers': [], 'dispatcher': createDispatcher(type) });
      ec.handlers.push(handler);
      return this;
    }

    function stopObserving(type, handler) {
      var ec, events, foundAt, length, data = this._events;

      if (!data) {
        return this;
      }
      if (fuse.Object.isString(type)) {
        type = String(type);
      }
      // if the event type is omitted we stop
      // observing all handlers on the element
      events = data.events;
      if (!type) {
        fuse.Object.each(events, function(handlers, type) {
          stopObserving.call(element, type);
        });
        return this;
      }
      if (ec = events[type]) {
        // if the handler is omitted we stop
        // observing all handlers of that type
        if (handler == null) {
          length = ec.handlers.length;
          while (length--) stopObserving.call(this, type, length);
          return this;
        }
      } else {
        // bail when no event data
        return this;
      }

      foundAt = fuse.Object.isNumber(handler) ?
        handler : fuse._.arrIndexOf.call(ec.handlers, handler);

      if (foundAt < 0) {
        return this;
      }
      // remove handler
      ec.handlers.splice(foundAt, 1);

      // if no more handlers remove the event type data
      if (!ec.handlers.length) {
        delete events[type];
      }
      return this;
    }

    return {
      'fire': fire,
      'observe': observe,
      'stopObserving': stopObserving
    };
  })();

  /*------------------------------ LANG: EVENT -------------------------------*/

  fuse.Class.mixins.event = (function() {

    var huid = fuse.uid + '_eventHandler',

    arrIndexOf = (function(fn) {
      return fn && fn.raw || function(value) {
        var length = this.length;
        while (length--) {
          if (this[length] === value) return length;
        }
        return -1;
      };
    })(fuse.Array.plugin.indexOf),

    fire = function fire(type) {
      var handler, args, i = -1, debug = fuse.debug, klass = this,
       events = klass._events || (klass._events = { }), handlers = events[type];

      if (handlers) {
        handlers = slice.call(handlers, 0);
        args = arguments.length > 1 ? slice.call(arguments, 1) : [];
        while (handler = handlers[++i]) {
          if (debug) {
            // script injection allows handlers to fail without haulting the while loop
            fuse[huid] = function() { handler.apply(klass, args) };
            runScriptText('fuse.' + huid + '()');
            delete fuse[huid];
          }
          else if (args) {
            handler.apply(this, args);
          } else {
            handler.call(this);
          }
        }
      }
      return this;
    },

    observe = function observe(type, handler) {
      var events = this._events || (this._events = { }),
       ec = events[type] || (events[type] = []);
      ec.push(handler);
      return this;
    },

    stopObserving = function stopObserving(type, handler) {
      var ec, foundAt, length,
       events = this._events || (this._events = { });

      if (!events) return this;
      type = isString(type) ? type && String(type) : null;

      // if the event type is omitted we stop
      // observing all handlers on the element
      if (!type) {
        eachKey(events, function(handlers, type) {
          stopObserving.call(element, type);
        });
        return this;
      }
      if (handlers = events[type]) {
        // if the handler is omitted we stop
        // observing all handlers of that type
        if (handler == null) {
          length = handlers.length;
          while (length--) stopObserving.call(this, type, length);
          return this;
        }
      } else {
        // bail when no event data
        return this;
      }

      foundAt = isNumber(handler) ? handler : arrIndexOf.call(handlers, handler);
      if (foundAt < 0) return this;

      // remove handler
      handlers.splice(foundAt, 1);

      // if no more handlers remove the event type data
      if (!handlers.length) {
        delete events[type];
      }
      return this;
    };

    return {
      'fire':          fire,
      'observe':       observe,
      'stopObserving': stopObserving
    };
  })();

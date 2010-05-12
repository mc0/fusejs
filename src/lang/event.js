  /*------------------------------ LANG: EVENT -------------------------------*/

  fuse.Class.mixins.event = (function() {

    var arrIndexOf = (function(fn) {
      return fn && fn.raw || function(value) {
        var length = this.length;
        while (length--) {
          if (this[length] === value) return length;
        }
        return -1;
      };
    })(fuse.Array.plugin.indexOf),

    fire = function fire(type) {
      var args, length, errors = [],
       events = this._events || (this._events = { }),
       handlers = events[type];

      if (!handlers) {
        return this;
      }
      if (arguments.length > 1) {
        args = slice.call(arguments, 1);
      }

      handlers = slice.call(handlers, 0);
      length = handlers.length;
      while (length--) {
        try {
          if (args) {
            handlers[length].apply(this, args);
          } else {
            handlers[length].call(this);
          }
        } catch (e) {
          errors.push(e);
        }
      }

      // re-throw errors
      if (length = errors.length) {
        if (length > 1) {
          // use msg to cleanup line number of reported error
          msg = 'Multiple errors thrown while handling the "' + type + '" event' +
            (this.inspect ? ' for the ' + this.inspect() + ' instance' : '') +
            ', see errors property';
          (error = new Error(msg)).errors = errors;
        } else {
          error = errors[0];
        }
        throw error;
      }
    };

    observe = function observe(type, handler) {
      var events = this._events || (this._events = { }),
       ec = events[type] || (events[type] = []);
      if (arrIndexOf.call(ec, handler) < 0) ec.push(handler);
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

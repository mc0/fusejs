  /* Based on Alex Arnell's inheritance implementation. */
  Class = {
    create: function() {
      var parent = null, properties = slice.call(arguments, 0);
      if (typeof properties[0] === 'function')
        parent = properties.shift();

      function klass() {
        this.initialize.apply(this, arguments);
      }

      Object.extend(klass, Class.Methods);
      klass.superclass = parent;
      klass.subclasses = [];

      if (parent) {
        var subclass = function() { };
        subclass.prototype = parent.prototype;
        klass.prototype = new subclass;
        parent.subclasses.push(klass);
      }

      for (var i = 0; i < properties.length; i++)
        klass.addMethods(properties[i]);

      if (!klass.prototype.initialize)
        klass.prototype.initialize = P.emptyFunction;

      klass.prototype.constructor = klass;

      return klass;
    }
  };

  Class.Methods = {
    addMethods: function(source) {
      var ancestor   = this.superclass && this.superclass.prototype;
      var properties = Object.keys(source);

      if (!Object.keys({ toString: true }).length)
        properties.push("toString", "valueOf");

      for (var i = 0, length = properties.length; i < length; i++) {
        var property = properties[i], value = source[property];
        if (ancestor && typeof value === 'function' &&
            value.argumentNames()[0] === '$super') {
          var method = value, value =(function(m) {
            return function() { return ancestor[m].apply(this, arguments) };
          })(property).wrap(method);

          value.valueOf = method.valueOf.bind(method);
          value.toString = method.toString.bind(method);
        }
        this.prototype[property] = value;
      }

      return this;
    }
  };

  Abstract = { };

  Object.extend = function(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  };

  Object.extend(Object, {
    inspect: function(object) {
      try {
        if (typeof object === 'undefined') return 'undefined';
        if (object === null) return 'null';
        return object.inspect ? object.inspect() : String(object);
      } catch (e) {
        if (e instanceof RangeError) return '...';
        throw e;
      }
    },

    toJSON: function(object) {
      var type = typeof object;
      switch (type) {
        case 'undefined':
        case 'function':
        case 'unknown': return;
        case 'boolean': return object.toString();
      }

      if (object === null) return 'null';
      if (object.toJSON) return object.toJSON();
      if (Object.isElement(object)) return;

      var results = [];
      for (var property in object) {
        var value = Object.toJSON(object[property]);
        if (typeof value !== 'undefined')
          results.push(property.toJSON() + ': ' + value);
      }

      return '{' + results.join(', ') + '}';
    },

    toQueryString: function(object) {
      return $H(object).toQueryString();
    },

    toHTML: function(object) {
      return object && object.toHTML ? object.toHTML() : String.interpret(object);
    },

    keys: function(object) {
      var keys = [];
      for (var property in object)
        keys.push(property);
      return keys;
    },

    values: function(object) {
      var values = [];
      for (var property in object)
        values.push(object[property]);
      return values;
    },

    clone: function(object) {
      return Object.extend({ }, object);
    },

    isElement: function(object) {
      return !!(object && object.nodeType == 1);
    },

    isArray: function(object) {
      return object != null && typeof object == "object" &&
        'splice' in object && 'join' in object;
    },

    isHash: function(object) {
      return !!(object && object instanceof Hash);
    },

    isFunction: function(object) {
      return typeof object == "function";
    },

    isString: function(object) {
      return typeof object == "string";
    },

    isNumber: function(object) {
      return typeof object == "number" && isFinite(object);
    },

    isUndefined: function(object) {
      return typeof object == "undefined";
    }
  });

  Object.extend(Function.prototype, {
    argumentNames: function() {
      var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
       .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
        .replace(/\s+/g, '').split(',');
      return names.length == 1 && !names[0] ? [] : names;
    },

    bind: function(object) {
      if (arguments.length < 2 && typeof arguments[0] === 'undefined') return this;
      var __method = this, args = slice.call(arguments, 1);

      // Avoid using Array#concat when only the context argument is given.
      if (args.length) {
        return function() {
          return __method.apply(object, args.concat(slice.call(arguments, 0)));
        };
      }
      return function() {
        return __method.apply(object, arguments);
      };
    },

    bindAsEventListener: function(object) {
      var __method = this, args = slice.call(arguments, 1);

      // Avoid using Array#concat when only the context argument is given.
      if (args.length) {
        return function(event) {
          return __method.apply(object, [event || window.event].concat(args));
        };
      }
      return function(event) {
        return __method.call(object, event || window.event);
      };
    },

    curry: function() {
      if (!arguments.length) return this;
      var __method = this, args = slice.call(arguments, 0);
      return function() {
        return arguments.length
          ? __method.apply(this, args.concat(slice.call(arguments, 0)))
          : __method.apply(this, args);
      }
    },

    delay: function(timeout) { 
      timeout *= 1000;
      var __method = this, args = slice.call(arguments, 1); 
      return global.setTimeout(function() {
        return __method.apply(__method, args);
      }, timeout);
    },

    defer: function() {
      var args = [0.01].concat(slice.call(arguments, 0));
      return this.delay.apply(this, args);
    },

    wrap: function(wrapper) {
      var __method = this;
      return function() {
        return arguments.length
          ? wrapper.apply(this, [__method.bind(this)].concat(slice.call(arguments, 0)))
          : wrapper.call(this, __method.bind(this));
      }
    },

    methodize: function() {
      if (this._methodized) return this._methodized;
      var __method = this;
      return this._methodized = function() {
        return arguments.length
           ? __method.apply(null, [this].concat(slice.call(arguments, 0)))
           : __method.call(null, this);
      };
    }
  });

  Date.prototype.toJSON = function() {
    return '"' + this.getUTCFullYear() + '-' +
      (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
      this.getUTCDate().toPaddedString(2) + 'T' +
      this.getUTCHours().toPaddedString(2) + ':' +
      this.getUTCMinutes().toPaddedString(2) + ':' +
      this.getUTCSeconds().toPaddedString(2) + 'Z"';
  };

  Try = {
    these: function() {
      var returnValue;

      for (var i = 0, length = arguments.length; i < length; i++) {
        var lambda = arguments[i];
        try {
          returnValue = lambda();
          break;
        } catch (e) { }
      }

      return returnValue;
    }
  };

  RegExp.prototype.match = RegExp.prototype.test;

  RegExp.escape = function(str) {
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
  };

  /*--------------------------------------------------------------------------*/

  PeriodicalExecuter = Class.create({
    initialize: function(callback, frequency) {
      this.callback = callback;
      this.frequency = frequency;
      this.currentlyExecuting = false;

      this.registerCallback();
    },

    registerCallback: function() {
      this.timer = global.setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
    },

    execute: function() {
      this.callback(this);
    },

    stop: function() {
      if (!this.timer) return;
      global.clearInterval(this.timer);
      this.timer = null;
    },

    onTimerEvent: function() {
      if (!this.currentlyExecuting) {
        try {
          this.currentlyExecuting = true;
          this.execute();
        } finally {
          this.currentlyExecuting = false;
        }
      }
    }
  });

  /*----------------------------- LANG: FUNCTIONS ----------------------------*/

  (function(Func) {

    // ES5 15.3.4.5
    Func.bind = function bind(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, curried, name, reset;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else {
        f = fn;
      }
      // follow spec and throw if fn is not callable
      if (typeof (f || context[name]) !== 'function') {
        throw new TypeError;
      }
      // bind with curry
      if (arguments.length > 2) {
        curried = slice.call(arguments, 2);
        reset = curried.length;

        return function() {
          curried.length = reset; // reset arg length
          return (f || context[name]).apply(thisArg, arguments.length
            ? concatList(curried, arguments)
            : curried);
        };
      }
      // simple bind
      return function() {
        var fn = f || context[name];
        return arguments.length
          ? fn.apply(thisArg, arguments)
          : fn.call(thisArg);
      };
    };

    Func.bindAsEventListener = function bindAsEventListener(fn, thisArg) {
      // allows lazy loading the target method
      var f, context, curried, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else {
        f = fn;
      }
      // bind with curry
      if (arguments.length > 2) {
        curried = slice.call(arguments, 2);
        return function(event) {
          return (f || context[name]).apply(thisArg,
            prependList(curried, event || getWindow(this).event));
        };
      }
      // simple bind
      return function(event) {
        return (f || context[name]).call(thisArg, event || getWindow(this).event);
      };
    };

    Func.curry = function curry(fn) {
      // allows lazy loading the target method
      var f, context, curried, name, reset;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else {
        f = fn;
      }

      if (arguments.length > 1) {
        curried = slice.call(arguments, 1);
        reset   = curried.length;

        return function() {
          curried.length = reset; // reset arg length
          var fn = f || context[name];
          return fn.apply(this, arguments.length
            ? concatList(curried, arguments)
            : curried);
        };
      }

      return f || context[name];
    };

    Func.delay = function delay(fn, timeout) {
      // allows lazy loading the target method
      var f, context, name, args = slice.call(arguments, 2);
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else {
        f = fn;
      }

      return setTimeout(function() {
        var fn = f || context[name];
        return fn.apply(fn, args);
      }, timeout * 1000);
    };

    Func.defer = function defer(fn) {
      return Func.delay.apply(global,
        concatList([fn, 0.01], slice.call(arguments, 1)));
    };

    Func.methodize = function methodize(fn) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1]; fn = context[name];
      } else {
        f = fn;
      }

      return fn._methodized || (fn._methodized = function() {
        var fn = f || context[name];
        return arguments.length
          ? fn.apply(global, prependList(arguments, this))
          : fn.call(global, this);
      });
    };

    Func.wrap = function wrap(fn, wrapper) {
      // allows lazy loading the target method
      var f, context, name;
      if (isArray(fn)) {
        name = fn[0]; context = fn[1];
      } else {
        f = fn;
      }

      return function() {
        var fn = f || context[name];
        return arguments.length
          ? wrapper.apply(this, prependList(arguments, Func.bind(fn, this)))
          : wrapper.call(this, Func.bind(fn, this));
      };
    };

    /*------------------------------------------------------------------------*/

    var plugin = Func.plugin;

    // native support
    if (isFunction(plugin.bind)) {
      var __bind = Func.bind;
      Func.bind = function bind(fn, thisArg) {
        // bind with curry
        var isLazy = isArray(fn);
        if (arguments.length > 2) {
          return isLazy
            ? __bind.apply(null, args)
            : plugin.bind.apply(fn, slice.call(args, 1));
        }
        // simple bind
        return isLazy
          ? __bind(fn, thisArg)
          : plugin.bind.call(fn, thisArg);
      };
    } else {
      plugin.bind = function bind(thisArg) {
        return arguments.length > 1
          ? Func.bind.apply(Func, prependList(arguments, this))
          : Func.bind(this, thisArg);
      };
    }

    plugin.bindAsEventListener = function bindAdEventListener(thisArg) {
      return arguments.length > 1
        ? Func.bindAdEventListener.apply(Func, prependList(arguments, this))
        : Func.bindAdEventListener(this, thisArg);
    };

    plugin.curry = function curry() {
      return arguments.length
        ? Func.curry.apply(Func, prependList(arguments, this))
        : this;
    };

    plugin.delay = function delay(timeout) {
      return arguments.length > 1
        ? Func.delay.apply(Func, prependList(arguments, this))
        : Func.delay(this, timeout);
    };

    plugin.defer = function defer() {
      return arguments.length
        ? Func.defer.apply(Func, prependList(arguments, this))
        : Func.defer(this);
    };

    plugin.methodize = function methodize() {
      return Func.methodize(this);
    };

    plugin.wrap = function wrap(wrapper) {
      return Func.wrap(this, wrapper);
    };

    // prevent JScript bug with named function expressions
    var bind =             null,
     bindAsEventListener = null,
     curry =               null,
     delay =               null,
     defer =               null,
     methodize =           null,
     wrap =                null;
  })(fuse.Function);

  /*------------------------ LANG: TIMER -----------------------*/

  fuse.Timer = (function() {

    function Klass() { }

    function Timer(callback, interval, options) {
      var instance = __instance || new Klass;
      __instance = null;

      instance.callback  = callback;
      instance.interval  = interval;
      instance.executing = false;
      instance.options   = Object.extend(Object.clone(Timer.defaults), options);
      return instance;
    }

    Timer.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Timer.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    var __instance, __apply = Klass.apply, __call = Klass.call,
     Object = fuse.Object;

    fuse.Class({ 'constructor': Timer });
    Klass.prototype = Timer.plugin;
    return Timer;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    function execute() {
      this.callback(this);
    }

    function onTimerEvent() {
      if (!this.executing) {
        this.executing = true;

        // IE6 bug with try/finally, the finally does not get executed if the
        // exception is uncaught. So instead we set the flags and start the
        // timer before throwing the error.
        try {
          this.execute();
          this.executing = false;
          if (this._timerId !== null) this.start();
        }
        catch (e) {
          this.executing = false;
          if (this._timerId !== null) this.start();
          throw e;
        }
      }
    }

    function start() {
      var instance = this;
      instance._timerId = setTimeout(function() { onTimerEvent.call(instance) },
        instance.interval * instance.options.multiplier);
      return instance;
    }

    function stop() {
      var id = this._timerId;
      if (id !== null) {
        window.clearTimeout(id);
        this._timerId = null;
      }
      return this;
    }

    plugin.execute = execute;
    plugin.start = start;
    plugin.stop = stop;

  })(fuse.Timer.plugin);

  fuse.Timer.defaults = {
    multiplier: 1
  };

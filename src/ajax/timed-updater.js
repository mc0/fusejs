  /*------------------------ AJAX: PERIODICAL UPDATER ------------------------*/

  fuse.ajax.TimedUpdater = (function() {

    function Klass() { }

    function TimedUpdater(container, url, options) {
      var dispatcher, ec,
       callbackName = 'on' + fuse._.capitalize(fuse.ajax.Request.READY_STATES[4]),
       instance = __instance || new Klass,
       options = Object.extend(Object.clone(TimedUpdater.defaults), options),
       onDone = options[callbackName] || Klass;

      instance.observe(callbackName, onDone);
      ec = instance._events.events[callbackName];
      dispatcher = ec.dispatcher;

      ec.dispatcher = function(request, json) {
        var options = instance.options, decay = options.decay,
         responseText = request.responseText;

        if (!request.isAborted()) {
          if (decay) {
            instance.decay = Math.min(responseText == String(instance.lastText) ?
              (instance.decay * decay) : 1, instance.maxDecay);
            instance.lastText = responseText;
          }
          instance.timer = setTimeout(function() { instance.start() },
            instance.decay * instance.frequency * instance.timerMultiplier);
  
          dispatcher(request, json);
        }
      };

      if (onDone == Klass) {
        ec.handlers = [];
      }
      if (options.onStop) {
        instance.observe('stop', onStop);
      }

      __instance = null;
      fuse.ajax.Base.call(instance, url, options);

      instance.container = container;
      instance.frequency = options.frequency;
      instance.maxDecay  = options.maxDecay;

      instance.start();
      return instance;
    }

    TimedUpdater.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    TimedUpdater.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    var __instance, __apply = Klass.apply, __call = Klass.call,
     Object = fuse.Object;

    fuse.Class(fuse.ajax.Base, { 'constructor': TimedUpdater });
    Klass.prototype = TimedUpdater.plugin;
    return TimedUpdater;
  })();

  /*--------------------------------------------------------------------------*/

  (function(TimedUpdater) {

    function start() {
      this.updater = new fuse.ajax.Updater(this.container, this.url, this.options);
    }

    function stop() {
      clearTimeout(this.timer);
      this.lastText = null;
      this.updater.abort();
      this.fire('stop');
    }

    plugin.start = start;
    plugin.stop = stop;

  })(fuse.ajax.TimedUpdater);

  fuse.ajax.TimedUpdater.defaults = {
    decay:     1,
    frequency: 2,
    maxDecay:  Infinity
  };

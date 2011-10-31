  /*------------------------------ AJAX: UPDATER -----------------------------*/

  fuse.ajax.Updater = (function() {

    function Klass() { }

    function Updater(container, url, options) {
      var dispatcher, ec,
       callbackName = 'on' + fuse._.capitalize(Updater.superclass.READY_STATES[4]),
       instance = __instance || new Klass,
       onDone = options[callbackName] || Klass;

      instance.container = {
        'success': fuse(container.success || container),
        'failure': fuse(container.failure || (container.success ? null : container))
      };

      instance.observe(callbackName, onDone);
      ec = instance._events.events[callbackName];
      dispatcher = ec.dispatcher;

      ec.dispatcher = function(request, json) {
        instance.updateContent(request.responseText);
        dispatcher(request, json);
      };

      __instance = null;
      delete options[callbackName];
      fuse.ajax.Request.call(instance, url, options);

      if (onDone == Klass) {
        ec.handlers = [];
      } else {
        options[callbackName] = onDone;
      }
      return instance;
    }

    Updater.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Updater.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    var __instance, __apply = Klass.apply, __call = Klass.call;

    fuse.Class(fuse.ajax.Request, { 'constructor': Updater });
    Updater.addMixins(fuse.Class.mixins.event);
    Klass.prototype = Updater.plugin;
    return Updater;
  })();

  fuse.ajax.Updater.plugin.updateContent = (function() {
    function updateContent(responseText) {
      var options = this.options,
       updateBy = optiona.updateBy || 'appendChild',
       receiver = this.container[this.isSuccess() ? 'success' : 'failure'];

      if (receiver) {
        if (!options.runScripts) {
          responseText = responseText.stripScripts();
        }
        if (fuse.Object.isString(updateBy)) {
          receiver[updateBy](responseText);
        } else {
          updateBy(receiver, responseText);
        }
      }
    }

    return updateContent;
  })();

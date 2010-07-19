  /*------------------------------ AJAX: UPDATER -----------------------------*/

  fuse.ajax.Updater = (function() {
    var Request = fuse.ajax.Request,

    Klass = function() { },

    Updater = function Updater(container, url, options) {
      var callbackName = 'on' + capitalize(Request.READY_STATES[4]),
       instance = __instance || new Klass,
       onDone = options[callbackName];

      __instance = null;

      instance.container = {
        'success': fuse(container.success || container),
        'failure': fuse(container.failure || (container.success ? null : container))
      };

      options[callbackName] = function(request, json) {
        instance.updateContent(request.responseText);
        onDone && onDone(request, json);
      };

      // this._super() equivalent
      fuse.ajax.Request.call(instance, url, options);
      if (onDone) options[callbackName] = onDone;

      return instance;
    },

    __instance,
    __apply = Updater.apply,
    __call = Updater.call;

    Updater.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Updater.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    fuse.Class(fuse.ajax.Request, { 'constructor': Updater });
    Klass.prototype = Updater.plugin;
    return Updater;
  })();

  fuse.ajax.Updater.plugin.updateContent = (function() {
    var updateContent = function updateContent(responseText) {
      var insertion,
       options = this.options,
       receiver = this.container[this.isSuccess() ? 'success' : 'failure'];

      if (receiver) {
        if (!options.runScripts) {
          responseText = responseText.stripScripts();
        }
        if (options.insertion) {
          if (isString(options.insertion)) {
            insertion = { };
            insertion[options.insertion] = responseText;
            receiver.insert(insertion);
          } else {
            options.insertion(receiver, responseText);
          }
        } else {
          receiver.update(responseText);
        }
      }
    };

    return updateContent;
  })();

  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  fuse.addNS('ajax.responders');

  fuse.ajax.activeRequestCount = 0;

  (function(responders) {

    var eventMixins = fuse.Class.mixins.event,
     isHash = fuse.Object.isHash,
     observe = eventMixins.observe,
     stopObserving = eventMixins.stopObserving;

    function register(responder) {
      var name;
      if (isHash(responder)) responder = responder._object;
      for (name in responder) {
        observe.call(responders, name.slice(2).toLowerCase(), responder[name]);
      }
    }

    function unregister(responder) {
      var name;
      if (isHash(responder)) responder = responder._object;
      for (name in responder) {
        stopObserving.call(responders, name.slice(2).toLowerCase(), responder[name]);
      }
    }

    responders.fire = eventMixins.fire;
    responders.register = register;
    responders.unregister = unregister;

    register({
      'onCreate': function() {
        fuse.ajax.activeRequestCount++;
      },
      'onDone': function() {
        fuse.ajax.activeRequestCount--;
      }
    });

  })(fuse.ajax.responders);

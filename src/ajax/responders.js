  /*---------------------------- AJAX: RESPONDERS ----------------------------*/

  fuse.addNS('ajax.responders');

  fuse.ajax.activeRequestCount = 0;

  (function(responders) {

    var eventMixins = fuse.Class.mixins.event,
     observe = eventMixins.observe,
     stopObserving = eventMixins.stopObserving;

    responders._events = { };

    responders.fire = eventMixins.fire;

    responders.register = function register(responder) {
      var name;
      if (isHash(responder)) responder = responder._object;
      for (name in responder) {
        observe.call(responders, name.slice(2).toLowerCase(), responder[name]);
      }
    };

    responders.unregister = function unregister(responder) {
      var name;
      if (isHash(responder)) responder = responder._object;
      for (name in responder) {
        stopObserving.call(responders, name.slice(2).toLowerCase(), responder[name]);
      }
    };

    responders.register({
      'onCreate': function() {
        fuse.ajax.activeRequestCount++;
      },
      'onDone': function() {
        fuse.ajax.activeRequestCount--;
      }
    });

    // prevent JScript bug with named function expressions
    var register = null, unregister = null;
  })(fuse.ajax.responders);

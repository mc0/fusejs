  /*---------------------------- AJAX: REQUEST -------------------------------*/

  fuse.ajax.Request = (function() {

    var ORIGIN = '__origin__';

    function Klass() { }

    function Request(url, options) {
      var eventType,
       handler,
       i = -1,
       j = i,
       capitalize = fuse._.capitalize,
       instance = __instance || new Klass,
       origin = instance.send[ORIGIN];

      __instance = null;
      fuse.ajax.Base.call(instance, url, options || { });
      options = instance.options;

      while (eventType = Request.READY_STATES[++i]) {
        if (handler = options['on' + capitalize(eventType)]) {
          instance.observe(eventType, handler);
        }
      }
      while (eventType = EVENT_TYPES[++j]) {
        if (handler = options['on' + capitalize(eventType)]) {
          instance.observe(eventType, handler);
        }
      }

      instance.readyState   = origin.Number(0);
      instance.responseText = origin.String('');
      instance.status       = origin.Number(0);
      instance.statusText   = origin.String('');

      instance.fire('create');
      return instance;
    }

    Request.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Request.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Request.READY_STATES =
     fuse.Array('unsent', 'opened', 'headersReceived', 'loading', 'done');

    var __instance, __apply = Klass.apply, __call = Klass.call,
     EVENT_TYPES = ['abort', 'create', 'exception', 'failure', 'success', 'timeout'];

    fuse.Class(fuse.ajax.Base, { 'constructor': Request });
    Request.addMixins(fuse.Class.mixins.event);
    Klass.prototype = Request.plugin;
    return Request;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var ORIGIN = '__origin__',
        createGetter = fuse._.createGetter,
        euid            = fuse._.uid + '_error',
        fireEvent       = fuse.Class.mixins.event.fire,
        isSameOrigin    = fuse.Object.isSameOrigin,
        noop            = fuse.Function.NOOP,
        responders      = fuse.ajax.responders,
        // content-type is case-insensitive
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.7
        reHTTP            = /^https?:/,
        reContentTypeJS   = /^\s*(?:text|application)\/(x-)?(?:java|ecma)script(?:;|\s|$)/i,
        reContentTypeJSON = /^\s*(?:application\/json)(?:;|\s|$)/i;

    /*------------------------------------------------------------------------*/

    function curry(method, instance) {
      return function(event) {
        return method(instance, event);
      };
    }

    function createIsSuccess(useStatus) {
      // http status code definitions
      // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
      var isSuccess = function isSuccess() { return this.status == 0 };
      if (useStatus) {
        isSuccess = function isSuccess() {
          var status = this.status;
          return status >= 200 && status < 300 || status == 304;
        };
      }
      return isSuccess;
    }

    function fireException(instance, exception) {
      fireEvent.call(instance, 'exception', instance, exception);
      // support global responders
      responders && responders.fire('exception', instance, exception);
      // throw error if not caught by a request exception handler
      var handlers = instance._events.events.exception;
      if (!handlers || !handlers.length) {
        throw exception;
      }
    }

    function onStateChange(instance, event, forceState) {
      // ensure all states are fired and only fired once per change
      var endState = instance.raw.readyState, readyState = instance.readyState;
      if (readyState < 4) {
        if (forceState != null) {
          readyState = forceState - 1;
        }
        while (readyState < endState) {
          setReadyState(instance, ++readyState);
        }
      }
    }

    function onTimeout(instance) {
      var xhr = instance.raw;
      if (instance.readyState != 4) {
        xhr.onreadystatechange = noop;
        xhr.abort();
        // skip to complete readyState and flag it as timedout
        instance.isTimedout = createGetter('isTimedout', true);
        setReadyState(instance, 4);
      }
    }

    function setReadyState(instance, readyState) {
      var contentType, e, evalJS, eventType, hasText, heandlers, json, responseText,
       responseXML, status, statusText, successOrFailure, timerId, i = -1,
       events       = instance._events.events,
       eventTypes   = [],
       skipped      = { },
       options      = instance.options,
       origin       = instance.send[ORIGIN],
       url          = instance.url,
       xhr          = instance.raw,
       isAborted    = instance.isAborted(),
       isTimedout   = instance.isTimedout(),
       evalJSON     = options.evalJSON,
       sanitizeJSON = options.sanitizeJSON || !isSameOrigin(url);

      // exit if no headers and wait for state 3 to fire states 2 and 3
      if (readyState == 2 && instance.getAllHeaders() == '' &&
        xhr.readyState == 2) {
        return;
      }

      instance.readyState = origin.Number(readyState);

      // clear response values on aborted/timedout requests
      if (isAborted || isTimedout) {
        instance.headerJSON   =
        instance.responseJSON =
        instance.responseXML  = null;
        instance.responseText = origin.String('');
        instance.status       = origin.Number(0);
        instance.statusText   = origin.String('');
      }
      else if (readyState > 1) {
        // Request status/statusText have really bad cross-browser consistency.
        // Monsur Hossain has done an exceptional job cataloging the cross-browser
        // differences.
        // http://replay.waybackmachine.org/20090629230725/http://monsur.com/blog/2007/12/28/xmlhttprequest-status-codes/
        // http://blogs.msdn.com/b/ieinternals/archive/2009/07/23/the-ie8-native-xmlhttprequest-object.aspx

        // Assume Firefox is throwing an error accessing status/statusText
        // caused by a 408 request timeout
        try {
          status = xhr.status;
          statusText = xhr.statusText;
        } catch(e) {
          status = 408;
          statusText = 'Request Timeout';
        }

        // IE will return 1223 for 204 no content
        instance.status = origin.Number(status == 1223 ? 204 : status);

        // set statusText
        instance.statusText = origin.String(statusText);

        // set responseText
        if (readyState > 2) {
          // IE will throw an error when accessing responseText in state 3
          try {
            if (responseText = xhr.responseText) {
              instance.responseText = origin.String(responseText);
            }
          } catch (e) { }
        }
        else if (readyState == 2 && evalJSON &&
            (json = instance.getHeader('X-JSON')) && json != '') {
          // set headerJSON
          try {
            instance.headerJSON = json.evalJSON(sanitizeJSON);
          } catch (e) {
            fireException(instance, e);
          }
        }
      }

      if (readyState == 4) {
        contentType  = instance.getHeader('Content-type') || '';
        evalJS       = options.evalJS;
        timerId      = instance._timerId;
        responseText = instance.responseText;
        hasText      = !responseText.isBlank();

        // clear timeout timer
        if (timerId != null) {
          window.clearTimeout(timerId);
          instance._timerId = null;
        }

        if (status != null) {
          status = String(status);
        }
        if (isAborted) {
          eventTypes.push('abort');
          if (status) eventTypes.push(status);
        }
        else if (isTimedout) {
          eventTypes.push('timeout');
          if (status) eventTypes.push(status);
        }
        else {
          // don't call global/request onSuccess/onFailure callbacks on aborted/timedout requests
          if (status) eventTypes.push(status);
          successOrFailure = instance.isSuccess() ? 'success' : 'failure';
          eventTypes.push(successOrFailure);

          // skip success/failure request events if status handler exists
          skipped['on' + (options['on' + status] ?
            successOrFailure : status)] = 1;

          // remove event handler to avoid memory leak in IE
          xhr.onreadystatechange = noop;

          // set responseXML
          responseXML = xhr.responseXML;

          // IE will return an invalid XML object if the response
          // content-type header is not text/xml
          if (responseXML && fuse.Object.isHostType(responseXML, 'documentElement')) {
            instance.responseXML = responseXML;
          }

          // set responseJSON
          if (evalJSON == 'force' || evalJSON && hasText &&
              reContentTypeJSON.test(contentType)) {
            try {
              instance.responseJSON = responseText.evalJSON(sanitizeJSON);
            } catch (e) {
              fireException(instance, e);
            }
          }

          // eval javascript
          if (hasText && (evalJS == 'force' || evalJS && isSameOrigin(url) &&
              reContentTypeJS.test(contentType))) {

            fuse.run('try{' + responseText.unfilterJSON() + '}catch(e){fuse.'  + euid + '=e}');

            if (e = fuse[euid]) {
              delete fuse[euid];
              fireException(instance, e);
            }
          }
        }
      }

      // add readyState to the list of events to fire
      eventTypes.push(instance.constructor.READY_STATES[readyState]);

      while (eventType = eventTypes[++i]) {
        // temporarily remove handlers so only responders are called
        if (skipped[eventType]) {
          handlers = events[eventType];
          delete events[eventType];
          instance.fire(eventType, instance, instance.headerJSON);
          events[eventType] = handlers;
        }
        else {
          instance.fire(eventType, instance, instance.headerJSON);
        }
      }
    }

    /*------------------------------------------------------------------------*/

    function abort() {
      var xhr = this.raw;
      if (this.readyState != 4) {
        // clear onreadystatechange handler to stop some browsers calling
        // it when the request is aborted
        xhr.onreadystatechange = noop;
        xhr.abort();

        this.isAborted = createGetter('isAborted', true);
        setReadyState(this, 4);
      }
      return this;
    }

    function fire(eventType) {
      try {
        fireEvent.apply(this, arguments);
      } catch (e) {
        fireException(this, e);
      }
      if (responders) {
        responders.fire.apply(responders, arguments);
      }
      return this;
    }

    function getAllHeaders() {
      var result;
      try { result = this.raw.getAllResponseHeaders(); } catch (e) { }
      return getAllHeaders[ORIGIN].String(result || '');
    }

    function getHeader(name) {
      var result;
      try { result = this.raw.getResponseHeader(name); } catch (e) { }
      return result != null ? getHeader[ORIGIN].String(result) : null;
    }

    function send() {
      var key,
       origin  = send[ORIGIN],
       body    = this.body,
       url     = this.url,
       options = this.options,
       async   = options.asynchronous,
       headers = options.headers,
       timeout = options.timeout;

      // reset flags
      this.isAborted  = createGetter('isAborted', false);
      this.isTimedout = createGetter('isTimedout', false);

      // reset response values
      this.headerJSON   =
      this.responseJSON =
      this.responseXML  = null;
      this.readyState   = origin.Number(0);
      this.responseText = origin.String('');
      this.status       = origin.Number(0);
      this.statusText   = origin.String('');

      // non-http requests don't use http status codes
      // return true if request url is http(s) or, if relative, the pages url is http(s)
      this.isSuccess = createIsSuccess(
        reHTTP.test(url) || (url.slice(0, 6).indexOf(':') < 0 ?
          reHTTP.test(location.protocol) : false));

      // start timeout timer if provided
      if (timeout != null) {
        this._timerId = setTimeout(curry(onTimeout, this), timeout * this.timerMultiplier);
      }

      onStateChange(this, null, 0);

      try {
        // attach onreadystatechange event after open() to avoid some browsers
        // firing duplicate readyState events
        xhr.open(this.method.toUpperCase(), url, async, options.username, options.password);
        xhr.onreadystatechange = curry(onStateChange, this);

        // set headers
        // use regular for...in because we aren't worried about shadowed properties
        for (key in headers) {
          xhr.setRequestHeader(key, headers[key]);
        }

        // if body is a string ensure it's a primitive
        xhr.send(fuse.Object.isString(body) ? String(body) : body);

        // force Firefox to handle readyState 4 for synchronous requests
        if (!async) {
          onStateChange(this);
        }
      }
      catch (e) {
        fireException(this, e);
      }
      return this;
    }

    /*------------------------------------------------------------------------*/

    plugin.headerJSON   =
    plugin.responseJSON =
    plugin.responseXML  = null;
    plugin.isAborted    = createGetter('isAborted', false);
    plugin.isSuccess    = createGetter('isSussess', false);
    plugin.isTimedout   = createGetter('isTimedout', false);

    plugin.abort = abort;
    plugin.fire = fire;

    (plugin.getAllHeaders = getAllHeaders)[ORIGIN] =
    (plugin.getHeader = getHeader)[ORIGIN] =
    (plugin.send = send)[ORIGIN] = fuse;

  })(fuse.ajax.Request.plugin);

  /*---------------------------- AJAX: REQUEST -------------------------------*/

  fuse.ajax.Request = (function() {

    var Klass = function() { },

    Request = function Request(url, options) {
      var instance   = __instance || new Klass,
       onStateChange = instance.onStateChange,
       onTimeout     = instance.onTimeout;

      __instance = null;
      instance.raw = fuse.ajax.create();

      instance.onTimeout =
        function() { onTimeout.call(instance); };

      instance.onStateChange =
        function(event, forceState) { onStateChange.call(instance, event, forceState); };

      instance.request(url, options);
      return instance;
    },

    __instance,
    __apply = Request.apply,
    __call  = Request.call;

    Request.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Request.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    fuse.Class(fuse.ajax.Base, { 'constructor': Request });
    Klass.prototype = Request.plugin;

    Request.READY_STATES = fuse.Array('unsent', 'opened', 'headersReceived', 'loading', 'done');
    Request.addMixins(fuse.Class.mixins.event);
    return Request;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var EVENT_TYPES  = ['abort', 'exception', 'failure', 'success', 'timeout'],
     isSameOrigin    = fuse.Object.isSameOrigin,
     reContentTypeJS = /^\s*(text|application)\/(x-)?(java|ecma)script(;|\s|$)/i,
     reHTTP          = /^https?:/,
     responders      = fuse.ajax.responders,
     fireEvent       = fuse.Class.mixins.event.fire,

    fireException = function(request, exception) {
      fireEvent.call(request, 'exception', request, exception);
      responders && responders.fire('exception', request, exception);
      // throw error if not caught by a request exception handler
      var handlers = request._events.exception;
      if (!handlers || !handlers.length) throw exception;
    };

    /*------------------------------------------------------------------------*/

    plugin._useStatus   = true;
    plugin._timerId     = null;
    plugin.readyState   = fuse.Number(0);
    plugin.responseText = fuse.String('');
    plugin.status       = fuse.Number(0);
    plugin.statusText   = fuse.String('');

    plugin.headerJSON   =
    plugin.responseJSON =
    plugin.responseXML  = null;

    plugin.isAborted    = createGetter('isAborted', false);
    plugin.isTimedout   = createGetter('isTimedout', false);

    plugin.abort = function abort() {
      var xhr = this.raw;
      if (this.readyState != 4) {
        // clear onreadystatechange handler to stop some browsers calling
        // it when the request is aborted
        xhr.onreadystatechange = NOOP;
        xhr.abort();

        // skip to complete readyState and flag it as aborted
        this.isAborted = createGetter('isAborted', true);
        this.setReadyState(4);
      }
    };

    plugin.fire = function fire(eventType) {
      try {
        fireEvent.apply(this, arguments);
      } catch (e) {
        fireException(this, e);
      }
      if (responders) {
        responders.fire.apply(responders, arguments);
      }
    };

    plugin.getAllHeaders = function getAllHeaders() {
      var result;
      try { result = this.raw.getAllResponseHeaders(); } catch (e) { }
      return fuse.String(result || '');
    };

    plugin.getHeader = function getHeader(name) {
      var result;
      try { result = this.raw.getResponseHeader(name); } catch (e) { }
      return result ? fuse.String(result) : null;
    };

    plugin.onTimeout = function onTimeout() {
      var xhr = this.raw;
      if (this.readyState != 4) {
        xhr.onreadystatechange = NOOP;
        xhr.abort();

        // skip to complete readyState and flag it as timedout
        this.isTimedout = createGetter('isTimedout', true);
        this.setReadyState(4);
      }
    };

    plugin.onStateChange = function onStateChange(event, forceState) {
      // ensure all states are fired and only fired once per change
      var endState = this.raw.readyState, readyState = this.readyState;
      if (readyState < 4) {
        if (forceState != null) {
          readyState = forceState - 1;
        }
        while (readyState < endState) {
          this.setReadyState(++readyState);
        }
      }
    };

    plugin.request = function request(url, options) {
      var async, body, eventType, handler, headers, key, timeout, url,
       i = -1, j = i, xhr = this.raw;

      // treat request() as the constructor and call Base as $super
      // if first call or new options are passed
      if (!this.options || options) {
        fuse.ajax.Base.call(this, url, options);
        options = this.options;

        while (eventType = fuse.ajax.Request.READY_STATES[++i]) {
          if (handler = options['on' + capitalize(eventType)]) {
            this.observe(eventType, handler);
          }
        }
        while (eventType = EVENT_TYPES[++j]) {
          if (handler = options['on' + capitalize(eventType)]) {
            this.observe(eventType, handler);
          }
        }
      } else {
        options = this.options;
      }

      async   = options.asynchronous;
      headers = options.headers;
      timeout = options.timeout;
      body    = this.body;
      url     = this.url;

      // reset flags
      this.isAborted  = createGetter('isAborted', false);
      this.isTimedout = createGetter('isTimedout', false);

      // reset response values
      this.headerJSON   = this.responseJSON = this.responseXML = null;
      this.readyState   = fuse.Number(0);
      this.responseText = fuse.String('');
      this.status       = fuse.Number(0);
      this.statusText   = fuse.String('');

      // non-http requests don't use http status codes
      // return true if request url is http(s) or, if relative, the pages url is http(s)
      this._useStatus = reHTTP.test(url) ||
        (url.slice(0, 6).indexOf(':') < 0 ?
          reHTTP.test(window.location.protocol) : false);

      // start timeout timer if provided
      if (timeout != null) {
        this._timerId = setTimeout(this.onTimeout, timeout * this.timerMultiplier);
      }

      // fire onCreate callbacks
      this.fire('create', options.onCreate);

      // trigger uninitialized readyState 0
      this.onStateChange(null, 0);

      try {
        // attach onreadystatechange event after open() to avoid some browsers
        // firing duplicate readyState events
        xhr.open(this.method.toUpperCase(), url, async, options.username, options.password);
        xhr.onreadystatechange = this.onStateChange;

        // set headers
        // use regular for...in because we aren't worried about shadowed properties
        for (key in headers) {
          xhr.setRequestHeader(key, headers[key]);
        }

        // if body is a string ensure it's a primitive
        xhr.send(isString(body) ? String(body) : body);

        // force Firefox to handle readyState 4 for synchronous requests
        if (!async) this.onStateChange();
      }
      catch (e) {
        fireException(this, e);
      }
    };

    plugin.setReadyState = function setReadyState(readyState) {
      var contentType, e, evalJS, eventType, hasText, heandlers, json, responseText,
       responseXML, status, statusText, successOrFailure, timerId, i = -1,
       events       = this._events,
       eventTypes   = [],
       skipped      = { },
       options      = this.options,
       url          = this.url,
       xhr          = this.raw,
       isAborted    = this.isAborted(),
       isTimedout   = this.isTimedout(),
       evalJSON     = options.evalJSON,
       sanitizeJSON = options.sanitizeJSON || !isSameOrigin(url);

      // exit if no headers and wait for state 3 to fire states 2 and 3
      if (readyState == 2 && this.getAllHeaders() == '' &&
        xhr.readyState == 2) {
        return;
      }

      this.readyState = fuse.Number(readyState);

      // clear response values on aborted/timedout requests
      if (isAborted || isTimedout) {
        this.headerJSON   = this.responseJSON = this.responseXML = null;
        this.responseText = fuse.String('');
        this.status       = fuse.Number(0);
        this.statusText   = fuse.String('');
      }
      else if (readyState > 1) {
        // Request status/statusText have really bad cross-browser consistency.
        // Monsur Hossain has done an exceptional job cataloging the cross-browser
        // differences.
        // http://monsur.com/blog/2007/12/28/xmlhttprequest-status-codes/
        // http://blogs.msdn.com/ieinternals/archive/2009/07/23/The-IE8-Native-XMLHttpRequest-Object.aspx

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
        this.status = fuse.Number(status == 1223 ? 204 : status);

        // set statusText
        this.statusText = fuse.String(statusText);

        // set responseText
        if (readyState > 2) {
          // IE will throw an error when accessing responseText in state 3
          try {
            if (responseText = xhr.responseText) {
              this.responseText = fuse.String(responseText);
            }
          } catch (e) { }
        }
        else if (readyState == 2 && evalJSON &&
            (json = this.getHeader('X-JSON')) && json != '') {
          // set headerJSON
          try {
            this.headerJSON = json.evalJSON(sanitizeJSON);
          } catch (e) {
            fireException(this, e);
          }
        }
      }

      if (readyState == 4) {
        contentType  = this.getHeader('Content-type') || '',
        evalJS       = options.evalJS,
        timerId      = this._timerId;
        responseText = this.responseText;
        hasText      = !responseText.isBlank();

        // clear timeout timer
        if (timerId != null) {
          window.clearTimeout(timerId);
          this._timerId = null;
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
          successOrFailure = this.isSuccess() ? 'success' : 'failure';
          eventTypes.push(successOrFailure);

          // skip success/failure request events if status handler exists
          skipped['on' + (options['on' + status] ?
            successOrFailure : status)] = 1;

          // remove event handler to avoid memory leak in IE
          xhr.onreadystatechange = NOOP;

          // set responseXML
          responseXML = xhr.responseXML;
          if (responseXML) {
            this.responseXML = responseXML;
          }

          // set responseJSON
          if (evalJSON == 'force' || evalJSON && hasText &&
              contentType.indexOf('application/json') > -1) {
            try {
              this.responseJSON = responseText.evalJSON(sanitizeJSON);
            } catch (e) {
              fireException(this, e);
            }
          }

          // eval javascript
          if (hasText && (evalJS == 'force' || evalJS && isSameOrigin(url) &&
              contentType.match(reContentTypeJS))) {

            fuse.run('try{' + responseText.unfilterJSON() + '}catch(e){fuse.'  + uid + '_error=e}');

            if (e = fuse[uid + '_error']) {
              delete fuse[uid + '_error'];
              fireException(this, e);
            }
          }
        }
      }

      // add readyState to the list of events to fire
      eventTypes.push(fuse.ajax.Request.READY_STATES[readyState]);

      while (eventType = eventTypes[++i]) {
        // temporarily remove handlers so only responders are called
        if (skipped[eventType]) {
          handlers = events[eventType];
          delete events[eventType];
          this.fire(eventType, this, this.headerJSON);
          events[eventType] = handlers;
        }
        else {
          this.fire(eventType, this, this.headerJSON);
        }
      }
    };

    plugin.isSuccess = function isSuccess() {
      // http status code definitions
      // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
      var status = this.status;
      return this._useStatus
        ? (status >= 200 && status < 300 || status == 304)
        : status == 0;
    };

    // prevent JScript bug with named function expressions
    var abort =      null,
     fire =          null,
     getHeader =     null,
     getAllHeaders = null,
     isSuccess =     null,
     onStateChange = null,
     onTimeout =     null,
     request =       null,
     setReadyState = null;
  })(fuse.ajax.Request.plugin);

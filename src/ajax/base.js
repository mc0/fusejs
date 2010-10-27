 /*------------------------------- AJAX: BASE -------------------------------*/

  fuse.ajax.Base = fuse.Class(function() {

    function Base(url, options) {
      var encoding, customHeaders, headers, length, method, params, queryString,
       i = 0, body = null, defaults = Base.defaults, defaultHeaders = defaults.headers;

      // clone default options/headers and overwrite with user options
      delete defaults.headers;
      defaults = Object.clone(defaults);
      Base.defaults.headers = defaultHeaders;
      defaults.headers = Object.clone(defaultHeaders);

      // remove headers from user options to be added in further down
      if (options && options.headers) {
        customHeaders = options.headers;
        delete options.headers;
      }

      options = this.options = Object.extend(defaults, options);
      encoding = options.encoding;
      headers = options.headers;
      method = options.method.toLowerCase();
      params = options.parameters;

      // convert string/hash parameters to an object
      if (Object.isString(params)) {
        params = fuse.String(params).toQueryParams();
      } else if (Object.isHash(params)) {
        params = params.toObject();
      } else {
        params = Object.clone(params);
      }

      // simulate other verbs over post
      if (!/^(get|post)$/.test(method)) {
        params['_method'] = method;
        method = 'post';
      }

      // if no url is provided use the window's location data
      if (!url || url == '') {
        url = location.protocol + '//' + location.host + location.pathname;
        if (!params || params == '') {
          params = location.search.slice(1);
        }
      }

      // when GET request, append parameters to URL
      queryString = Object.toQueryString(params);
      if ( method == 'get' && queryString != '') {
        url += (url.indexOf('?') > -1 ? '&' : '?') + queryString;
      }

      // Playing it safe here, even though we could not reproduce this bug,
      // jQuery tickets #2570, #2865 report versions of Opera will display a
      // login prompt when passing null-like values for username/password when
      // no authorization is needed.
      if (!options.username) {
        options.username = options.password = '';
      }

      // body is null for every method except POST
      if (method == 'post') {
        body = options.postBody || queryString;
      }

      // add in user defined array/hash/object headers over the default
      if (typeof customHeaders == 'object') {
        if (Object.isArray(customHeaders)) {
          for (length = customHeaders.length; i < length; i += 2) {
            headers[customHeaders[i]] = customHeaders[i + 1];
          }
        }
        else {
          if (Object.isHash(customHeaders)) {
            customHeaders = customHeaders._object;
          }
          for (key in customHeaders) {
            headers[key] = customHeaders[key];
          }
        }
      }

      // ensure character encoding is set in headers of POST requests
      if (method == 'post' && (headers['Content-type'] || '').indexOf('charset=') < 0) {
        headers['Content-type'] = options.contentType +
          (encoding ? '; charset=' + encoding : '');
      }

      // set default timeout multiplier
      this.timerMultiplier = options.timerMultiplier ||
        fuse.Timer && fuse.Timer.defaults.multiplier || 1;

      this.body = body;
      this.method = fuse.String(method);
      this.parameters = params;
      this.url = fuse.String(url);
    }

    var Object = fuse.Object;
    return { 'constructor': Base };
  });

  fuse.ajax.Base.defaults = {
    asynchronous: true,
    contentType: 'application/x-www-form-urlencoded',
    encoding: 'UTF-8',
    evalJS: true,
    evalJSON: !!fuse.String.plugin.evalJSON,
    forceMethod: false,
    method: 'post',
    parameters: '',
    headers: {
      Accept: 'text/javascript, text/html, application/xml, text/xml, */*',
      'X-Fuse-Version': fuse.version,
      'X-Requested-With': 'XMLHttpRequest'
    }
  };

  /*------------------------------- LANG: JSON -------------------------------*/

  fuse.jsonFilter = /^\/\*-secure-([\s\S]*)\*\/\s*$/;

  (function() {
    var inspect = fuse.String.inspect,

    numberToJSON = function(number) {
      return fuse.String(isFinite(this) ? this : 'null');
    };

    //stringify
    Obj.toJSON = function toJSON(value) {
      switch (typeof value) {
        case 'undefined':
        case 'function' :
        case 'unknown'  : return;
        case 'boolean'  : return fuse.String(value);
        case 'number'   : return numbertoJSON(value);
        case 'string'   : return inspect.call(value, true);
      }

      if (value === null) return fuse.String(null);

      switch (toString.call(value)) {
        case '[object Boolean]': return fuse.String(value);
        case '[object Number]' : return numbertoJSON(value);
        case '[object String]' : return inspect.call(value, true);
        case '[object Array]'  :
          for (var value, i = 0, results = fuse.Array(), length = this.length; i < length; i++) {
            value = Obj.toJSON(this[i]);
            if (typeof value !== 'undefined') results.push(value);
          }
          return fuse.String('[' + results.join(', ') + ']');
      }
      
      if (typeof object.toJSON === 'function')
        return object.toJSON();
      if (isElement(value)) return;

      var results = [];
      eachKey(object, function(value, key) {
        value = Obj.toJSON(value);
        if (typeof value !== 'undefined')
          results.push(inspect.call(key, true) + ': ' + value);
      });
      return fuse.String('{' + results.join(', ') + '}');
    };

    if (fuse.Hash) {
      fuse.Hash.plugin.toJSON = function toJSON() {
        return Obj.toJSON(this._object);
      };
    }

    // ECMA-5 15.9.5.44
    if (!fuse.Date.plugin.toISOString) {
      fuse.Date.plugin.toISOString = function toISOString() {
        return fuse.String('"' + this.getUTCFullYear() + '-' +
          fuse.Number(this.getUTCMonth() + 1).toPaddedString(2) + '-' +
          this.getUTCDate().toPaddedString(2)    + 'T' +
          this.getUTCHours().toPaddedString(2)   + ':' +
          this.getUTCMinutes().toPaddedString(2) + ':' +
          this.getUTCSeconds().toPaddedString(2) + 'Z"');
      };
    }

    if (!fuse.Date.plugin.toJSON) {
      fuse.Date.plugin.toJSON = function toJSON() {
        return this.toISOString();
      };
    }

    // ECMA-5 15.5.4.21
    if (!fuse.String.plugin.toJSON) {
      fuse.String.plugin.toJSON = function toJSON() {
        return fuse.String(this).inspect(true);
      };
    }

    // prevent JScript bug with named function expressions
    var toJSON = nil;
  })();

  /*--------------------------------------------------------------------------*/

  // complementary JSON methods for String.plugin

  (function(plugin) {
    // parseJSON

    plugin.evalJSON = function evalJSON(sanitize) {
      if (this == null) throw new TypeError;
      var string = fuse.String(this), json = string.unfilterJSON();

      try {
        if (!sanitize || json.isJSON())
          return global.eval('(' + String(json) + ')');
      } catch (e) { }
      throw new SyntaxError('Badly formed JSON string: ' + string.inspect());
    };

    parseJSON() {
      return JSON.parse(this.unfilterJSON())
    }
    
    plugin.isJSON = function isJSON() {
      if (this == null) throw new TypeError;
      var string = String(this);
      if (/^\s*$/.test(string)) return false;

      /*
      if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
      */
      
      
      string = string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
      return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string);
    };

    plugin.unfilterJSON = function unfilterJSON(filter) {
      if (this == null) throw new TypeError;
      return fuse.String(String(this).replace(filter || fuse.jsonFilter, '$1'));
    };

    // prevent JScript bug with named function expressions
    var evalJSON = null, isJSON = null, unfilterJSON = null;
  })(fuse.String.plugin);

  /*----------------------------- LANG: TEMPLATE -----------------------------*/

  fuse.Template = (function() {
    var Klass = function() { },

    Template = function Template(template, pattern) {
      pattern || (pattern = fuse.Template.defaultPattern);
      if (!isRegExp(pattern)) {
        pattern = fuse.RegExp(escapeRegExpChars(pattern));
      }
      if (!pattern.global) {
        pattern = fuse.RegExp.clone(pattern, { 'global': true });
      }

      var instance = __instance || new Klass;
      __instance = null;

      instance.pattern  = pattern;
      instance.template = template;
      instance.preparse();
      return instance;
    },

    __instance,
    __apply = Template.apply,
    __call = Template.call;

    Template.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Template.call = function(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    Class({ 'constructor': Template });
    Klass.prototype = Template.plugin;
    return Template;
  })();

  fuse.Template.defaultPattern = /(\\)?(#\{([^}]*)\})/;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var cache,

    reDots = /\./g,

    reEscaped = /\\/g,

    reSplitDots = /\b(?!\\)\./,

    reBrackets = /\[((?:(?!\])[^\\]|\\.)*)\]/g,

    escapeDot = function(match, path) {
      return '.' + path.replace(reDots, '\\.');
    },

    replace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
      fuse.String.plugin.replace : ''.replace,

    split = function(string, pattern) {
      var match, lastIndex = 0, results = [];
      pattern = new RegExp(pattern.source, 'g');

      while (match = pattern.exec(string)) {
        match[0] = string.slice(lastIndex, match.index);
        results.push.apply(results, match);
        lastIndex = pattern.lastIndex;
      }
      // add end of string
      results.push(string.slice(lastIndex));
      return results;
    };

    plugin.preparse = function preparse() {
      var backslash, prop, chain, temp, token, j, i =1,
       template = String(this.template),
       parts    = split(template, this.pattern),
       length   = parts.length;

      // init cache
      cache = { };

      for ( ; i < length; i += 4) {
        backslash = parts[i];
        token     = parts[i + 1];
        chain     = parts[i + 2];

        // process non escaped tokens
        if (!backslash) {
          j = -1; temp = split(chain, reSplitDots); chain = [];
          while (prop = temp[++j]) {
            // convert bracket notation to dot notation then split and add
            if (prop.indexOf('[') > -1) {
              prop = replace.call(prop, reBrackets, escapeDot);
              if (prop.charAt(0) === '.') prop = prop.slice(1);
              chain.push.apply(chain, split(prop, reSplitDots));
            }
            // simply add
            else {
              chain.push(prop);
            }
          }
          // unescape property names
          j = -1;
          while (prop = chain[++j]) {
            chain[j] = prop.replace(reEscaped, '');
          }

          // cache
          cache[token] = {
            'chain': chain,
            'reToken': new RegExp(escapeRegExpChars(token), 'g')
          };
        }
        else {
          // unescape tokens
          template = template.replace(backslash + token, token);
        }
      }

      this.template = fuse.String(template);
      return this;
    };

    plugin.parse = function parse(object) {
      var i, o, c, chain, found, lastIndex, length, prop, token,
       result = String(this.template);

      if (object) {
        if (isHash(object)) {
          object = object._object;
        } else if (typeof object.toTemplateReplacements === 'function') {
          object = object.toTemplateReplacements();
        } else if (typeof object.toObject === 'function') {
          object = object.toObject();
        }
      }

      object || (object = { });
      for (token in cache) {
        i = -1; found = false; c = cache[token]; o = object;
        chain = c.chain;
        length = chain.length;
        lastIndex = length - 1;

        while (++i < length) {
          if (!hasKey(o, prop = chain[i])) break;
          o = o[prop];
          found = i === lastIndex;
        }
        // replace token with property value if found and != null
        result = result.replace(c.reToken, found && o != null ? o : '');
      }
      return fuse.String(result);
    };

    // prevent JScript bug with named function expressions
    var preparse = nil, parse = nil;
  })(fuse.Template.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var replace = plugin.replace,

    prepareReplacement = function(replacement) {
      if (typeof replacement === 'function') {
        return function() { return replacement(slice.call(arguments, 0, -2)); };
      }
      var template = fuse.Template(replacement);
      return function() { return template.parse(slice.call(arguments, 0, -2)); };
    };

    plugin.gsub = function gsub(pattern, replacement) {
      if (this == null) throw new TypeError;

      if (!isRegExp(pattern)) {
        pattern = fuse.RegExp(escapeRegExpChars(pattern), 'g');
      }
      if (!pattern.global) {
        pattern = fuse.RegExp.clone(pattern, { 'global': true });
      }
      return replace.call(this, pattern, prepareReplacement(replacement));
    };

    plugin.interpolate = function interpolate(object, pattern) {
      if (this == null) throw new TypeError;
      return fuse.Template(this, pattern).parse(object);
    };

    plugin.scan = function scan(pattern, callback) {
      if (this == null) throw new TypeError;
      var result = fuse.String(this);
      result.gsub(pattern, callback);
      return result;
    };

    plugin.sub = function sub(pattern, replacement, count) {
      if (this == null) throw new TypeError;
      count = typeof count === 'undefined' ? 1 : count;

      if (count === 1) {
        if (!isRegExp(pattern)) {
          pattern = fuse.RegExp(escapeRegExpChars(pattern));
        }
        if (pattern.global) {
          pattern = fuse.RegExp.clone(pattern, { 'global': false });
        }
        return replace.call(this, pattern, prepareReplacement(replacement));
      }

      if (typeof replacement !== 'function') {
        var template = fuse.Template(replacement);
        replacement = function(match) { return template.parse(match); };
      }

      return fuse.String(this).gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    };

    // prevent JScript bug with named function expressions
    var gsub = nil, interpolate = nil, scan = nil, sub = nil;
  })(fuse.String.plugin);

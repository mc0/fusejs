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
      if (pattern.constructor !== fuse.RegExp) {
        pattern = fuse.Object(pattern);
      }

      var instance = __instance || new Klass;
      __instance = null;

      instance.pattern = pattern;
      instance.template = fuse.String(template);
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

  fuse.Template.defaultPattern = /(\\)?(#\{([^}]*)\})/g;

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var reBackslashs = /\\/g,

    reBrackets = /\[((?:(?!\])[^\\]|\\.)*)\]/g,

    reDots = /\./g,

    reSplitByDot = /\b(?!\\)\./g,

    escapeDots = function(match, path) {
      return '.' + path.replace(reDots, '\\.');
    },

    replace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
      fuse.String.plugin.replace : ''.replace,

    split = ''.split;

    if (envTest('STRING_SPLIT_BUGGY_WITH_REGEXP')) {
      split = function(pattern) {
        var index, lastIndex, match,
         lastLastIndex = 0, string = String(this), results = [];

        if (!pattern.global) {
          pattern = new RegExp(pattern.source, 'g' +
            (pattern.ignoreCase ? 'i' : '') +
            (pattern.multiline  ? 'm' : ''));
        } else {
          pattern.lastIndex = 0;
        }
        while (match = pattern.exec(string)) {
          index = match.index;
          lastIndex = index + match[0].length;
          match[0] = string.slice(lastLastIndex, index);
          lastLastIndex =
          pattern.lastIndex = lastIndex;

          results.push.apply(results, match);

          // avoid infinite loop
          if (lastLastIndex === index) {
            pattern.lastIndex++;
          }
        }
        results.push(string.slice(lastLastIndex));
        return results;
      };
    }

    plugin.preparse = function preparse() {
      var backslash, chain, escaped, prop, temp, token, tokens, j, i = 1,
       template = String(this.template),
       parts    = split.call(template, this.pattern),
       length   = parts.length;

      escaped = this._escaped = { };
      tokens  = this._tokens  = { };
      this._lastTemplate = this.template;

      for ( ; i < length; i += 4) {
        backslash = parts[i];
        token     = parts[i + 1];
        chain     = parts[i + 2];

        // process non escaped tokens
        if (backslash != '\\') {
          // avoid parsing duplicates
          if (tokens[token]) continue;

          j = -1; temp = split.call(chain, reSplitByDot); chain = [];
          while (prop = temp[++j]) {
            // convert bracket notation to dot notation then split and add
            if (prop.indexOf('[') > -1) {
              prop = replace.call(prop, reBrackets, escapeDots);
              if (prop.charAt(0) === '.') prop = prop.slice(1);
              chain.push.apply(chain, split.call(prop, reSplitByDot));
            }
            // simply add
            else {
              chain.push(prop);
            }
          }
          // unescape property names
          j = -1;
          while (prop = chain[++j]) {
            chain[j] = prop.replace(reBackslashs, '');
          }

          // cache tokens
          tokens[token] = {
            'chain': chain,
            'reToken': new RegExp(escapeRegExpChars(token), 'g')
          };
        }
        else {
          // mark to unescape
          escaped[token] = escapeRegExpChars(backslash + token);
        }
      }

      for (token in escaped) {
        // unescape tokens that are not being replaced
        if (!tokens[token]) {
          template = template.replace(new RegExp(escaped[token], 'g'), token);
          delete escaped[token];
        }
        // changed escaped tokens slightly so they aren't
        // replaced like thier none-escaped duplicates
        else {
          temp = Math.floor(token.length / 2);
          temp = token.slice(0, temp) + expando + token.slice(temp);
          template = template.replace(new RegExp(escaped[token], 'g'), temp);
          escaped[token] = new RegExp(escapeRegExpChars(temp), 'g');
        }
      }

      // cache modified template
      this._template = template;
      return this;
    };

    plugin.parse = function parse(object) {
      // check if cache has expired
      if (this.template !== this._lastTemplate) {
        this.preparse();
      }

      var i, o, c, chain, found, lastIndex, length, prop, token,
       escaped = this._escaped,
       tokens  = this._tokens,
       result  = String(this._template);

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
      for (token in tokens) {
        i = -1; found = false; c = tokens[token]; o = object;
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

      // unescape remianing tokens
      for (token in escaped) {
        result = result.replace(escaped[token], token);
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

      if (count == null || count == 1) {
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

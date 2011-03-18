  /*----------------------------- LANG: TEMPLATE -----------------------------*/

  /* create shared pseudo private props */

  fuse.Object.extend(fuse._, {
    reBackslashs: /\\/g,
    reBrackets: /\[((?:(?!\])[^\\]|\\.)*)\]/g,
    reDots: /\./g,
    reSplitByDot: /\b(?!\\)\./g
  });

  fuse._.escapeDots = function(match, path) {
    return '.' + path.replace(fuse._.reDots, '\\.');
  };

  fuse._.prepareSubReplacement = function(replacement) {
    var template, slice = Array.prototype.slice;
    if (typeof replacement == 'function') {
      return function() { return replacement(slice.call(arguments, 0, -2)); };
    }
    template = fuse.Template(replacement);
    return function() { return template.parse(slice.call(arguments, 0, -2)); };
  };

  /*--------------------------------------------------------------------------*/

  fuse.Template = (function() {

    var ORIGIN = '__origin__';

    function Klass() { }

    function Template(template, pattern) {
      var p = fuse._, origin = Template[ORIGIN],
       RegExp = origin.RegExp, instance = __instance || new Klass;

      pattern || (pattern = origin.Template.defaults.pattern);
      __instance = null;

      if (!origin.Object.isRegExp(pattern)) {
        pattern = RegExp(p.escapeRegExpChars(pattern));
      }
      if (!pattern.global) {
        pattern = RegExp.clone(pattern, { 'global': true });
      }
      if (pattern.constructor != RegExp) {
        pattern = origin.Object(pattern);
      }
      instance.pattern = pattern;
      instance.template = origin.String(template);
      instance.preparse();
      return instance;
    }

    Template.apply = function(thisArg, argArray) {
      __instance = thisArg;
      return __apply.call(this, thisArg, argArray);
    };

    Template.call = function call(thisArg) {
      __instance = thisArg;
      return __call.apply(this, arguments);
    };

    var __instance, __apply = Klass.apply, __call = Klass.call;

    fuse.Class({ constructor: Template });
    Template[ORIGIN] = fuse;
    Klass.prototype = Template.plugin;
    return Template;
  })();

  fuse.Template.defaults = {
    pattern: /(\\)?(#\{([^}]*)\})/g
  };

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var ORIGIN = '__origin__';

    function clone() {
      return this.constructor(this.template, this.pattern);
    }

    function preparse() {
      var backslash, chain, escaped, prop, temp, token, tokens, j,
       p = fuse._, i = 1, template = String(this.template),
       parts = p.strSplit.call(template, this.pattern), length = parts.length,
       escaped = this._escaped = { }, tokens  = this._tokens  = { };

      this._lastTemplate = this.template;

      for ( ; i < length; i += 4) {
        backslash = parts[i];
        token     = parts[i + 1];
        chain     = parts[i + 2];

        // process non escaped tokens
        if (backslash != '\\') {
          // avoid parsing duplicates
          if (tokens[token]) continue;

          j = -1; temp = p.strSplit.call(chain, p.reSplitByDot); chain = [];
          while (prop = temp[++j]) {
            // convert bracket notation to dot notation then split and add
            if (prop.indexOf('[') > -1) {
              prop = p.strReplace.call(prop, p.reBrackets, p.escapeDots);
              if (prop.charAt(0) == '.') prop = prop.slice(1);
              chain.push.apply(chain, p.strSplit.call(prop, p.reSplitByDot));
            }
            // simply add
            else {
              chain.push(prop);
            }
          }
          // unescape property names
          j = -1;
          while (prop = chain[++j]) {
            chain[j] = prop.replace(p.reBackslashs, '');
          }
          // cache tokens
          tokens[token] = {
            'chain': chain,
            'reToken': new RegExp(p.escapeRegExpChars(token), 'g')
          };
        }
        else {
          // mark to unescape
          escaped[token] = p.escapeRegExpChars(backslash + token);
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
          temp = token.slice(0, temp) + fuse.uid + token.slice(temp);
          template = template.replace(new RegExp(escaped[token], 'g'), temp);
          escaped[token] = new RegExp(p.escapeRegExpChars(temp), 'g');
        }
      }

      // cache modified template
      this._template = template;
      return this;
    }

    function parse(object) {
      var i, o, c, chain, escaped, found, lastIndex, length, prop,
       token, tokens, result, origin = parse[ORIGIN];

      // check if cache has expired
      if (this.template != this._lastTemplate) {
        this.preparse();
      }

      escaped = this._escaped;
      tokens  = this._tokens;
      result  = String(this._template);

      if (object) {
        if (origin.Object.isHash(object)) {
          object = object._object;
        } else if (typeof object.toTemplateReplacements == 'function') {
          object = object.toTemplateReplacements();
        } else if (typeof object.toObject == 'function') {
          object = object.toObject();
        }
      }

      object || (object = { });

      for (token in tokens) {
        i = -1;
        c = tokens[token];
        o = object;
        chain = c.chain;
        found = false;
        length = chain.length;
        lastIndex = length - 1;

        while (++i < length) {
          if (!origin.Object.hasKey(o, prop = chain[i])) {
            break;
          }
          o = o[prop];
          found = i == lastIndex;
        }
        // replace token with property value if found and != null
        result = result.replace(c.reToken, found && o != null ? o : '');
      }
      // unescape remianing tokens
      for (token in escaped) {
        result = result.replace(escaped[token], token);
      }
      return origin.String(result);
    }

    /*------------------------------------------------------------------------*/

    plugin.clone = clone;
    plugin.preparse = preparse;
    (plugin.parse = parse)[ORIGIN] = fuse;

  })(fuse.Template.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var ORIGIN = '__origin__';

    function gsub(pattern, replacement) {
      var p = fuse._, origin = gsub[ORIGIN];
      if (!origin.Object.isRegExp(pattern)) {
        pattern = origin.RegExp(p.escapeRegExpChars(pattern), 'g');
      }
      if (!pattern.global) {
        pattern = origin.RegExp.clone(pattern, { 'global': true });
      }
      return origin.String.prototype.replace
        .call(this, pattern, p.prepareSubReplacement(replacement));
    }

    function interpolate(object, pattern) {
      return interpolate[ORIGIN].Template(this, pattern).parse(object);
    }

    function scan(pattern, callback) {
      var result = scan[ORIGIN].String(this);
      result.gsub(pattern, callback);
      return result;
    }

    function sub(pattern, replacement, count) {
      var template, p = fuse._, origin = sub[ORIGIN];
      if (count == null || count == 1) {
        if (!origin.Object.isRegExp(pattern)) {
          pattern = origin.RegExp(p.escapeRegExpChars(pattern));
        }
        if (pattern.global) {
          pattern = origin.RegExp.clone(pattern, { 'global': false });
        }
        return origin.String.prototype.replace
          .call(this, pattern, p.prepareSubReplacement(replacement));
      }
      if (typeof replacement != 'function') {
        template = origin.Template(replacement);
        replacement = function(match) { return template.parse(match); };
      }
      return origin.String(this).gsub(pattern, function(match) {
        if (--count < 0) return match[0];
        return replacement(match);
      });
    }

    /*------------------------------------------------------------------------*/

    (plugin.gsub = gsub)[ORIGIN] =
    (plugin.interpolate = interpolate)[ORIGIN] =
    (plugin.scan = scan)[ORIGIN] =
    (plugin.sub = sub)[ORIGIN] = fuse;

  })(fuse.String.plugin);

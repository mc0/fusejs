  /*------------------------------ LANG: STRING ------------------------------*/

  (function(plugin) {
    var reBlank      = fuse.RegExp('^\\s*$'),
     reCapped        = /([A-Z]+)([A-Z][a-z])/g,
     reCamelCases    = /([a-z\d])([A-Z])/g,
     reDoubleColons  = /::/g,
     reHyphens       = /-/g,
     reHyphenated    = /-+(.)?/g,
     reOpenScriptTag = /<script/i,
     reUnderscores   = /_/g,
     reTrimLeft      = /^\s\s*/,
     reTrimRight     = /\s\s*$/,
     reScripts       = /<script[^>]*>([^\x00]*?)<\/script>/gi,
     reHTMLComments  = /<!--[\x20\t\n\r]*[^\x00]*?[\x20\t\n\r]*-->/gi,

    repeat = function(string, count) {
      // Based on work by Yaffle and Dr. J.R.Stockton.
      // Uses the `Exponentiation by squaring` algorithm.
      // http://www.merlyn.demon.co.uk/js-misc0.htm#MLS
      if (count < 1) return '';
      if (count % 2) return repeat(string, count - 1) + string;
      var half = repeat(string, count / 2);
      return half + half;
    },

    replace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
      plugin.replace : plugin.replace.raw,

    toUpperCase = function(match, character) {
      return character ? character.toUpperCase() : '';
    };


    plugin.blank = function blank() {
      return reBlank.test(this);
    };

    plugin.camelize = function camelize() {
      return fuse.String(replace.call(this, reHyphenated, toUpperCase));
    };

    plugin.capitalize = function capitalize() {
      var string = String(this);
      return fuse.String(string.charAt(0).toUpperCase() +
        string.slice(1).toLowerCase());
    };

    plugin.clone = function clone() {
      return fuse.String(this);
    };

    plugin.contains = function contains(pattern) {
      return String(this).indexOf(pattern) > -1;
    };

    plugin.isEmpty = function isEmpty() {
      return !String(this).length;
    };

    plugin.endsWith = function endsWith(pattern) {
      // when searching for a pattern at the end of a long string
      // indexOf(pattern, fromIndex) is faster than lastIndexOf(pattern)
      var string = String(this), d = string.length - pattern.length;
      return d >= 0 && string.indexOf(pattern, d) === d;
    };

    plugin.evalScripts = function evalScripts() {
      result = fuse.Array();
      fuse.String(this).extractScripts(function(script) {
        result.push(global.eval(String(script)));
      });

      return result;
    };

    plugin.extractScripts = function extractScripts(callback) {
      var match, script, striptTags,
       string = String(this), result = fuse.Array();

      if (!reOpenScriptTag.test(string)) return result;

      scriptTags = string.replace(reHTMLComments, '');
      // clear lastIndex because exec() uses it as a starting point
      reScripts.lastIndex = 0;

      if (callback) {
        while (match = reScripts.exec(scriptTags)) {
          if (script = match[1]) {
            callback(script);
            result.push(script);
          }
        }
      } else {
        while (match = reScripts.exec(scriptTags)) {
          if (script = match[1]) result.push(script);
        }
      }
      return result;
    };

    plugin.hyphenate = function hyphenate() {
      return fuse.String(String(this).replace(reUnderscores, '-'));
    };

    plugin.startsWith = function startsWith(pattern) {
      // when searching for a pattern at the start of a long string
      // lastIndexOf(pattern, fromIndex) is faster than indexOf(pattern)
      return !String(this).lastIndexOf(pattern, 0);
    };

    plugin.stripScripts = function stripScripts() {
      return fuse.String(String(this).replace(reScripts, ''));
    };

    plugin.times = function times(count) {
      return fuse.String(repeat(String(this), toInteger(count)));
    };

    plugin.toArray = function toArray() {
      return fuse.String(this).split('');
    };

    plugin.truncate = function truncate(length, truncation) {
      var endIndex, string = String(this);
      length = +length;

      if (isNaN(length)) length = 30;
      if (length < string.length) {
        truncation = truncation == null ? '...' : String(truncation);
        endIndex = length - truncation.length;
        string = endIndex > 0 ? string.slice(0, endIndex) + truncation : truncation;
      }
      return fuse.String(string);
    };

    plugin.underscore = function underscore() {
      return fuse.String(String(this)
        .replace(reDoubleColons, '/')
        .replace(reCapped,       '$1_$2')
        .replace(reCamelCases,   '$1_$2')
        .replace(reHyphens,      '_').toLowerCase());
    };

    // ES5 15.5.4.20
    if (!isFunction(plugin.trim)) {
      plugin.trim = function trim() {
        return String(this).replace(reTrimLeft, '').replace(reTrimRight, '');
      };

      plugin.trim.raw = plugin.trim;
    }
    // non-standard
    if (!isFunction(plugin.trimLeft)) {
      plugin.trimLeft = function trimLeft() {
        return String(this).replace(reTrimLeft, '');
      };

      plugin.trimLeft.raw = plugin.trimLeft;
    }
    // non-standard
    if (!isFunction(plugin.trimRight)) {
      plugin.trimRight = function trimRight() {
        return String(this).replace(reTrimRight, '');
      };

      plugin.trimRight.raw = plugin.trimRight;
    }

    // prevent JScript bug with named function expressions
    var blank =        null,
      camelize =       null,
      capitalize =     null,
      clone =          null,
      contains =       null,
      endsWith =       null,
      evalScripts =    null,
      extractScripts = null,
      hyphenate =      null,
      isEmpty =        null,
      startsWith =     null,
      stripScripts =   null,
      toArray =        null,
      times =          null,
      trim =           null,
      trimLeft =       null,
      trimRight =      null,
      truncate =       null,
      underscore =     null;
  })(fuse.String.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    // tag parsing instructions:
    // http://www.w3.org/TR/REC-xml-names/#ns-using
    var reTags = (function() {
      var name   = '[-\\w]+',
       space     = '[\\x20\\t\\n\\r]',
       eq        = space + '?=' + space + '?',
       charRef   = '&#[0-9]+;',
       entityRef = '&' + name + ';',
       reference = entityRef + '|' + charRef,
       attValue  = '"(?:[^<&"]|' + reference + ')*"|\'(?:[^<&\']|' + reference + ')*\'',
       attribute = '(?:' + name + eq + attValue + '|' + name + ')';

      return new RegExp('<'+ name + '(?:' + space + attribute + ')*' + space + '?/?>|' +
        '</' + name + space + '?>', 'g');
    })(),

    define = function() {
      var tags   = [],
       count     = 0,
       div       = fuse._div,
       container = fuse._doc.createElement('pre'),
       textNode  = container.appendChild(fuse._doc.createTextNode('')),
       reTagEnds = />/g,
       reTokens  = /@fusetoken/g,

       escapeHTML = function escapeHTML() {
         textNode.data = String(this);
         return fuse.String(container.innerHTML);
       },

       getText = function() {
         return div.textContent;
       },

       swapTagsToTokens = function(tag) {
         tags.push(tag);
         return '@fusetoken';
       },

       swapTokensToTags = function() {
         return tags[count++];
       },

       unescapeHTML = function unescapeHTML() {
         var result, tokenized, string = String(this);

         // tokenize tags before setting innerHTML then swap them after
         if (tokenized = string.indexOf('<') > -1) {
           tags.length = count = 0;
           string = plugin.replace.call(string, reTags, swapTagsToTokens);
         }

         div.innerHTML = '<pre>' + string + '<\/pre>';
         result = getText();

         return fuse.String(tokenized
           ? plugin.replace.call(result, reTokens, swapTokensToTags)
           : result);
       };


      // Safari 2.x has issues with escaping html inside a `pre`
      // element so we use the deprecated `xmp` element instead.
      textNode.data = '&';
      if (container.innerHTML !== '&amp;') {
        textNode = (container = fuse._doc.createElement('xmp'))
          .appendChild(fuse._doc.createTextNode(''));
      }
      // Safari 3.x has issues with escaping the ">" character
      textNode.data = '>';
      if (container.innerHTML !== '&gt;') {
        escapeHTML = function escapeHTML() {
          textNode.data = String(this);
          return fuse.String(container.innerHTML.replace(reTagEnds, '&gt;'));
        };
      }
      if (!envTest('ELEMENT_TEXT_CONTENT')) {
        div.innerHTML = '<pre>&lt;p&gt;x&lt;/p&gt;<\/pre>';

        if (envTest('ELEMENT_INNER_TEXT') && div.firstChild.innerText === '<p>x<\/p>') {
          getText = function() { return div.firstChild.innerText.replace(/\r/g, ''); };
        }
        else if (div.firstChild.innerHTML === '<p>x<\/p>') {
          getText = function() { return div.firstChild.innerHTML; };
        }
        else {
          getText = function() {
            var node, nodes = div.firstChild.childNodes, parts = [], i = 0;
            while (node = nodes[i++]) parts.push(node.nodeValue);
            return parts.join('');
          };
        }
      }

      // lazy define methods
      plugin.escapeHTML   = escapeHTML;
      plugin.unescapeHTML = unescapeHTML;

      return plugin[arguments[0]];
    };

    plugin.escapeHTML = function escapeHTML() {
      return define('escapeHTML').call(this);
    };

    plugin.unescapeHTML = function unescapeHTML() {
      return define('unescapeHTML').call(this);
    };

    plugin.stripTags = function stripTags() {
      return fuse.String(String(this).replace(reTags, ''));
    };

    // prevent JScript bug with named function expressions
    var escapeHTML = null, stripTags = null, unescapeHTML = null;
  })(fuse.String.plugin);

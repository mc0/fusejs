  /*------------------------------- LANG: HTML -------------------------------*/

  (function(plugin) {
    var reOpenScriptTag = /<script/i,
     reScripts = /<script[^>]*>([^\x00]*?)<\/script>/gi,

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

    plugin.stripScripts = function stripScripts() {
      return fuse.String(String(this).replace(reScripts, ''));
    };

    // prevent JScript bug with named function expressions
    var evalScripts = null, extractScripts = null, stripScripts = null;
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

  /*------------------------------- LANG: HTML -------------------------------*/

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
      var div     = fuse._div,
       container  = fuse._doc.createElement('pre'),
       textNode   = container.appendChild(fuse._doc.createTextNode('')),
       rawReplace = plugin.replace.raw,
       reTagEnds  = />/g,
       reTokens   = /@fuseTagToken/g,
       swapTags   = [],

      escapeHTML = function escapeHTML() {
        textNode.data = String(this);
        return fuse.String(container.innerHTML);
      },

      getText = function() {
        return div.textContent;
      },

      swapTagsToTokens = function(tag) {
        swapTags.unshift(tag);
        return '@fuseTagToken';
      },

      swapTokensToTags = function() {
        return swapTags.pop();
      },

      unescapeHTML = function unescapeHTML() {
        // tokenize tags before setting innerHTML then swap them after
        var tokenized, string = this;
        if (tokenized = string.indexOf('<') > -1) {
          string = plugin.replace.call(string, reTags, swapTagsToTokens);
        }
        div.innerHTML = '<pre>' + string + '<\/pre>';
        return fuse.String(tokenized
          ? plugin.replace.call(getText(), reTokens, swapTokensToTags)
          : getText());
      };

      // Safari 2.x has issues with escaping html inside a `pre`
      // element so we use the deprecated `xmp` element instead.
      textNode.data = '&';
      if (container.innerHTML != '&amp;') {
        textNode = (container = fuse._doc.createElement('xmp'))
          .appendChild(fuse._doc.createTextNode(''));
      }
      // Safari 3.x has issues with escaping the ">" character
      textNode.data = '>';
      if (container.innerHTML != '&gt;') {
        escapeHTML = function escapeHTML() {
          textNode.data = String(this);
          return fuse.String(container.innerHTML.replace(reTagEnds, '&gt;'));
        };
      }
      if (!envTest('ELEMENT_TEXT_CONTENT')) {
        div.innerHTML = '<pre>&lt;p&gt;x&lt;\/p&gt;<\/pre>';

        if (envTest('ELEMENT_INNER_TEXT') && div.firstChild.innerText == '<p>x<\/p>') {
          getText = function() { return div.firstChild.innerText.replace(/\r/g, ''); };
        }
        else if (div.firstChild.innerHTML == '<p>x<\/p>') {
          getText = function() { return div.firstChild.innerHTML; };
        }
        else {
          getText = function() {
            var node, nodes = div.firstChild.childNodes, parts = [], i = -1;
            while (node = nodes[++i]) parts[i] = node.data;
            return parts.join('');
          };
        }
      }
      // lazy define methods
      plugin.escapeHTML   = escapeHTML;
      plugin.unescapeHTML = unescapeHTML;

      return plugin[arguments[0]];
    };

    /*------------------------------------------------------------------------*/

    plugin.escapeHTML = function escapeHTML() {
      return define('escapeHTML').call(this);
    };

    plugin.unescapeHTML = function unescapeHTML() {
      return define('unescapeHTML').call(this);
    };

    plugin.stripTags = function stripTags() {
      return fuse.String(rawReplace.call(this, reTags, ''));
    };

    // prevent JScript bug with named function expressions
    var escapeHTML = null, stripTags = null, unescapeHTML = null;
  })(fuse.String.plugin);

  /*------------------------------- LANG: HTML -------------------------------*/

  (function(plugin) {

    var rawIndexOf = plugin.indexOf.raw,

    rawReplace = plugin.replace.raw,

    // tag parsing instructions:
    // http://www.w3.org/TR/REC-xml-names/#ns-using
    reTags = (function() {
      var name   = '[-\\w]+',
       space     = '[\\x20\\t\\n\\r]',
       eq        = space + '*=' + space + '*',
       charRef   = '&#[0-9]+;',
       entityRef = '&' + name + ';',
       reference = entityRef + '|' + charRef,
       attValue  = '"(?:[^<&"]|' + reference + ')*"|\'(?:[^<&\']|' + reference + ')*\'',
       attribute = '(?:' + name + eq + attValue + '|' + name + ')';

      return new RegExp('<'+ name + '(?:' + space + '+' + attribute + ')*' + space + '*/?>|' +
        '</' + name + space + '*>', 'g');
    })(),

    define = function() {
      var div     = fuse._div,
       container  = fuse._doc.createElement('pre'),
       textNode   = container.appendChild(fuse._doc.createTextNode('')),
       reEsAmp    = /&amp;/g,
       reEsLt     = /&lt;/g,
       reEsGt     = /&gt;/g,
       reUnAmp    = /&/g,
       reUnLt     = /</g,
       reUnGt     = />/g,
       reTokens   = /@fuseTagToken/g,
       swapTags   = [],

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

      // entity definitions
      // http://www.w3.org/TR/html401/sgml/intro.html
      escapeHTML = function escapeHTML(all) {
        var result;
        if (all) {
          textNode.data = String(this);
          result = container.innerHTML;
        } else {
          result = rawReplace
            .call(this, reUnAmp, '&amp;')
            .replace(reUnLt, '&lt;')
            .replace(reUnGt, '&gt;');
        }
        return fuse.String(result);
      },

      unescapeHTML = function unescapeHTML(all) {
        // tokenize tags before setting innerHTML then swap them after
        var tokenized, result = this;
        if (tokenized = rawIndexOf.call(result, '<') > -1) {
          result = plugin.replace.call(result, reTags, swapTagsToTokens);
        }
        if (all) {
          div.innerHTML = '<pre>' + result + '<\/pre>';
          result = getText();
        } else {
          result = rawReplace
            .call(result, reEsLt, '<')
            .replace(reEsGt, '>')
            .replace(reEsAmp, '&');
        }
        return fuse.String(tokenized
          ? plugin.replace.call(result, reTokens, swapTokensToTags)
          : result);
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
        var __escapeHTML = escapeHTML;
        escapeHTML = function escapeHTML(all) {
          var result;
          if (all) {
            textNode.data = String(this);
            result = fuse.String(rawReplace.call(container.innerHTML, reUnGt, '&gt;'));
          } else {
            result = __escapeHTML.call(this);
          }
          return result;
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
      plugin.escapeHTML = escapeHTML;
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

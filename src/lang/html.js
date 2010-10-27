  /*------------------------------- LANG: HTML -------------------------------*/

  /* create shared pseudo private props */

  fuse.Object.extend(fuse._, {
    reEsAmp: /&amp;/g,
    reEsLt: /&lt;/g,
    reEsGt: /&gt;/g,
    reUnAmp: /&/g,
    reUnLt: /</g,
    reUnGt: />/g,
    reTokens: /@fuseTagToken/g,
    swapTags: []
  });

  // tag parsing instructions:
  // http://www.w3.org/TR/REC-xml-names/#ns-using
  fuse._.reTags = (function() {
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
  })();

  fuse._.swapTagsToTokens = function(tag) {
    fuse._.swapTags.unshift(tag);
    return '@fuseTagToken';
  };

  fuse._.swapTokensToTags = function() {
    return fuse._.swapTags.pop();
  };

  /*--------------------------------------------------------------------------*/

  if (fuse.env.test('ELEMENT_INNER_HTML')) {

    (function(p) {

      var div = fuse._div, doc = fuse._doc, container = doc.createElement('pre'),
       textNode = container.appendChild(doc.createTextNode('')),

      swapTextToEntities = function(text) {
        textNode.data = String(text);
        return container.innerHTML;
      },

      swapEntitiesToText = function(entities) {
        div.innerHTML = '<pre>' + entities + '<\/pre>';
        return div.textContent;
      };

      // Safari 2.x has issues with escaping html inside a `pre`
      // element so we use the deprecated `xmp` element instead.
      textNode.data = '&';
      if (container.innerHTML != '&amp;') {
        container = doc.createElement('xmp');
        textNode = container.appendChild(doc.createTextNode(''));
      }

      // Safari 3.x has issues with escaping the ">" character
      textNode.data = '>';
      if (container.innerHTML != '&gt;') {
        swapTextToEntities = function(text) {
          textNode.data = String(text);
          return container.innerHTML.replace(p.reUnGt, '&gt;');
        };
      }

      if (!fuse.env.test('ELEMENT_TEXT_CONTENT')) {
        div.innerHTML = '<pre>&lt;p&gt;x&lt;\/p&gt;<\/pre>';
        if (fuse.env.test('ELEMENT_INNER_TEXT') && div.firstChild.innerText == '<p>x<\/p>') {
          swapEntitiesToText = function(entities) {
            div.innerHTML = '<pre>' + entities + '<\/pre>';
            return div.firstChild.innerText.replace(/\r/g, '');
          };
        }
        else if (div.firstChild.innerHTML == '<p>x<\/p>') {
          swapEntitiesToText = function(entities) {
            div.innerHTML = '<pre>' + entities + '<\/pre>';
            return div.firstChild.innerHTML;
          };
        }
        else {
          swapEntitiesToText = function(entities) {
            div.innerHTML = '<pre>' + entities + '<\/pre>';
            var node, nodes = div.firstChild.childNodes, i = -1, parts = [];
            while (node = nodes[++i]) parts[i] = node.data;
            return parts.join('');
          };
        }
      }

      p.swapEntitiesToText = swapEntitiesToText;
      p.swapTextToEntities = swapTextToEntities;

    })(fuse._);
  }

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    // entity definitions
    // http://www.w3.org/TR/html401/sgml/intro.html
    function escapeHTML(all) {
      var result, p = fuse._;
      if (all) {
        result = fuse._.swapTextToEntities(this);
      } else {
        result = p.rawReplace
          .call(this, p.reUnAmp, '&amp;')
          .replace(p.reUnLt, '&lt;')
          .replace(p.reUnGt, '&gt;');
      }
      return escapeHTML[ORIGIN].String(result);
    }

    function unescapeHTML(all) {
      // tokenize tags before setting innerHTML then swap them after
      var tokenized, p = fuse._, origin = unescapeHTML[ORIGIN],
       replace = origin.String.prototype.replace, result = this;

      if (tokenized = p.rawIndexOf.call(result, '<') > -1) {
        result = replace.call(result, p.reTags, p.swapTagsToTokens);
      }
      if (all) {
        result = p.swapEntitiesToText(result);
      } else {
        result = p.rawReplace
          .call(result, p.reEsLt, '<')
          .replace(p.reEsGt, '>')
          .replace(p.reEsAmp, '&');
      }
      return origin.String(tokenized
        ? replace.call(result, p.reTokens, p.swapTokensToTags)
        : result);
    }

    function stripTags() {
      var p = fuse._;
      return stripTags[ORIGIN].String(p.rawReplace.call(this, p.reTags, ''));
    }

    (plugin.escapeHTML = escapeHTML)[ORIGIN] =
    (plugin.stripTags = stripTags)[ORIGIN] =
    (plugin.unescapeHTML = unescapeHTML)[ORIGIN] = fuse;

  })(fuse.String.plugin);

  /*--------------------------- EVENT: DOM-LOADED ----------------------------*/

  // Support for the "dom:loaded" event is based on work by Dan Webb,
  // Matthias Miller, Dean Edwards, John Resig and Diego Perini.
  (function() {
    var cssPoller, readyStatePoller,

    FINAL_DOCUMENT_READY_STATES = { 'complete': 1, 'loaded': 1 },

    doc          = fuse._doc,

    decoratedDoc = fuse(doc),

    envTest      = fuse.env.test,

    isFramed     = true,

    isHostType   = fuse.Object.isHostType,

    isSameOrigin = fuse.Object.isSameOrigin,

    Poller = function(method) {
      var poller = this,
      callback   = function() {
        if (!method() && poller.id != null)
          poller.id = setTimeout(callback, 10);
      };

      this.id = setTimeout(callback, 10);
    },

    cssDoneLoading = function() {
      return (isCssLoaded = fuse.Function.TRUE)();
    },

    fireDomLoadedEvent = function() {
      readyStatePoller.clear();
      cssPoller && cssPoller.clear();
      return !decoratedDoc.isLoaded() && !!decoratedDoc.fire('dom:loaded');
    },

    checkCssAndFire = function() {
      return decoratedDoc.isLoaded()
        ? fireDomLoadedEvent()
        : !!(isCssLoaded() && fireDomLoadedEvent());
    },

    getSheetElements = function() {
      var i = 0, link, links = doc.getElementsByTagName('LINK'),
       result = fuse.Array.fromNodeList(doc.getElementsByTagName('STYLE'));
      while (link = links[i++])
        if (link.rel.toLowerCase() === 'stylesheet')
          result.push(link);
      return result;
    },

    getSheetObjects = function(elements) {
      for (var i = 0, result = [], element, sheet; element = elements[i++]; ) {
        sheet = getSheet(element);
        // bail when sheet is null/undefined on elements
        if (sheet == null) return false;
        if (isSameOrigin(sheet.href)) {
          result.push(sheet);
          if (!addImports(result, sheet))
            return false;
        }
      }
      return result;
    },

    checkDomLoadedState = function(event) {
      if (decoratedDoc.isLoaded()) {
        return readyStatePoller.clear();
      }
      // Not sure if readyState is ever `loaded` in
      // Safari 2.x but we check to be on the safe side
      if (FINAL_DOCUMENT_READY_STATES[doc.readyState] ||
          event && event.type === 'DOMContentLoaded') {
        readyStatePoller.clear();
        decoratedDoc.stopObserving('readystatechange', checkDomLoadedState);
        if (!checkCssAndFire()) cssPoller = new Poller(checkCssAndFire);
      }
    },

    addImports = function(collection, sheet) {
      return (addImports = isHostType(sheet, 'imports')
        ? function(collection, sheet) {
            var length = sheet.imports.length;
            while (length--) {
              if (isSameOrigin(sheet.imports[length].href)) {
                collection.push(sheet.imports[length]);
                addImports(collection, sheet.imports[length]);
              }
            }
            return collection;
          }
        : function(collection, sheet) {
            // Catch errors on partially loaded elements. Firefox may also
            // error when accessing css rules of sources using the file:// protocol
            try {
              var ss, rules = getRules(sheet), length = rules.length;
            } catch(e) {
              return false;
            }
            while (length--) {
              // bail when sheet is null on rules
              ss = rules[length].styleSheet;
              if (ss === null) return false;
              if (ss && isSameOrigin(ss.href)) {
                collection.push(ss);
                if (!addImports(collection, ss))
                  return false;
              }
            }
            return collection;
          }
      )(collection, sheet);
    },

    getStyle = function(element, styleName) {
      return (getStyle = envTest('ELEMENT_COMPUTED_STYLE')
        ? function(element, styleName) {
            var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
            return (style || element.style)[styleName];
          }
        : function(element, styleName) {
            return (element.currentStyle || element.style)[styleName];
          }
      )(element, styleName);
    },

    getSheet = function(element) {
      return (getSheet = isHostType(element, 'styleSheet')
        ? function(element) { return element.styleSheet; }
        : function(element) { return element.sheet; }
      )(element);
    },

    getRules = function(sheet) {
      return (getRules = isHostType(sheet, 'rules')
        ? function(sheet) { return sheet.rules; }
        : function(sheet) { return sheet.cssRules; }
      )(sheet);
    },

    addRule = function(sheet, selector, cssText) {
      return (addRule = isHostType(sheet, 'addRule')
        ? function(sheet, selector, cssText) { return sheet.addRule(selector, cssText); }
        : function(sheet, selector, cssText) { return sheet.insertRule(selector +
            '{' + cssText + '}', getRules(sheet).length); }
      )(sheet, selector, cssText);
    },

    removeRule = function(sheet, index) {
      return (removeRule = isHostType(sheet, 'removeRule')
        ? function(sheet, index) { return sheet.removeRule(index); }
        : function(sheet, index) { return sheet.deleteRule(index); }
      )(sheet, index);
    },

    isCssLoaded = function() {
      var sheetElements = getSheetElements();
      return !sheetElements.length
        ? cssDoneLoading()
        : (isCssLoaded = function() {
            var cache = [];
            return !(function() {
              var sheets = getSheetObjects(sheetElements);
              if (!sheets) return false;

              var className, length = sheets.length;
              while (length--) {
                className = 'fuse_css_loaded_' + cache.length;
                cache.push({ 'className': className, 'sheet': sheets[length] });
                addRule(sheets[length], '.' + className, 'margin-top: -1234px!important;');
              }
              return true;
            })()
              ? false
              : (isCssLoaded = function() {
                  var c, lastIndex, rules, length = cache.length, done = true;
                  while (length--) {
                    c = cache[length];
                    rules = getRules(c.sheet);
                    lastIndex = rules.length && rules.length - 1;

                    // if styleSheet was still loading when test rule
                    // was added it will have removed the rule.
                    if (rules[lastIndex].selectorText.indexOf(c.className) > -1) {
                      done = false;

                      // if the styleSheet has only the test rule then skip
                      if (rules.length === 1) continue;

                      if (!c.div) {
                        c.div = doc.createElement('div');
                        c.div.className = c.className;
                        c.div.style.cssText = 'position:absolute;visibility:hidden;';
                      }

                      doc.body.appendChild(c.div);

                      // when loaded clear cache entry
                      if (getStyle(c.div, 'marginTop') === '-1234px')
                        cache.splice(length, 1);

                      // cleanup
                      removeRule(c.sheet, lastIndex);
                      doc.body.removeChild(c.div);
                    }
                  }

                  if (done) {
                    cache = null;
                    return cssDoneLoading();
                  }
                  return done;
                })();
          })();
    };

    Poller.prototype.clear = function() {
      this.id != null && (this.id = global.clearTimeout(this.id));
    };

    /*------------------------------------------------------------------------*/

    // Ensure the document is not in a frame because
    // doScroll() will not throw an error when the document
    // is framed. Fallback on document readyState.
    if (!envTest('ELEMENT_ADD_EVENT_LISTENER') && envTest('ELEMENT_DO_SCROLL')) {

      // Avoid a potential browser hang when checking global.top (thanks Rich Dougherty)
      // The value of frameElement can be null or an object.
      // Checking global.frameElement could throw if not accessible.
      try { isFramed = global.frameElement != null; } catch(e) { }

      // Derived with permission from Diego Perini's IEContentLoaded
      // http://javascript.nwbox.com/IEContentLoaded/
      if (!isFramed) {
        checkDomLoadedState = function() {
          if (decoratedDoc.isLoaded()) {
            return readyStatePoller.clear();
          }
          if (doc.readyState === 'complete') {
            fireDomLoadedEvent();
          } else {
            try { fuse._div.doScroll(); } catch(e) { return; }
            fireDomLoadedEvent();
          }
        };
      }
    } else if (envTest('ELEMENT_ADD_EVENT_LISTENER')) {
      decoratedDoc.observe('DOMContentLoaded', checkDomLoadedState);
    }

    // readystate and poller are used (first one to complete wins)
    decoratedDoc.observe('readystatechange', checkDomLoadedState);
    readyStatePoller = new Poller(checkDomLoadedState);
  })();

  /*----------------------------- ELEMENT: STYLE -----------------------------*/

  (function(plugin) {

    var CHECK_DIMENSION_IS_NULL =
      envTest('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN'),

    CHECK_POSITION_IS_NULL =
      envTest('ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO'),

    FLOAT_TRANSLATIONS = typeof fuse._docEl.style.styleFloat != 'undefined'
      ? { 'float': 'styleFloat', 'cssFloat': 'styleFloat' }
      : { 'float': 'cssFloat' },

    NON_PX_NAMES = { 'fontWeight': 1, 'opacity': 1, 'zIndex': 1, 'zoom': 1 },

    POSITION_NAMES = { 'bottom': 1, 'left': 1, 'right': 1, 'top': 1 },

    DIMENSION_NAMES = { 'height': 1, 'width': 1 },

    RELATIVE_CSS_UNITS = { 'em': 1, 'ex': 1 },

    reOpacity   = /opacity:\s*(\d?\.?\d*)/,

    reOverflow  = /overflow:\s*([^;]+)/,

    reNonPxUnit = /^-?\d+(\.\d+)?(?!px)[%a-z]+$/i,

    reUnit      = /\D+$/,

    camelize = (function() {
      var cache = { },
      reHyphenated = /-([a-z])/gi,
      toUpperCase = function(match, letter) { return letter.toUpperCase(); },
      replace = envTest('STRING_REPLACE_COERCE_FUNCTION_TO_STRING') ?
        fuse.String.plugin.replace : ''.replace;

      return function(string) {
        return cache[string] ||
          (cache[string] = replace.call(string, reHyphenated, toUpperCase));
      };
    })(),

    getComputedStyle = function(element, name) {
      name = FLOAT_TRANSLATIONS[name] || name;
      var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
      return getValue(element, name, css && css[name]);
    },

    getValue = function(element, name, value) {
      name = FLOAT_TRANSLATIONS[name] || name;
      value || (value = element.style[name]);
      if (name == 'opacity') {
        return value == '1' ? '1.0' : parseFloat(value) || '0';
      }
      return value == 'auto' || value === '' ? null : value;
    },

    isNull = function(element, name) {
      var result = false;
      if (CHECK_POSITION_IS_NULL && POSITION_NAMES[name]) {
        result = getComputedStyle(element, 'position') == 'static';
      }
      else if (CHECK_DIMENSION_IS_NULL && DIMENSION_NAMES[name]) {
        result = getComputedStyle(element, 'display') == 'none';
      }
      return result;
    };

    plugin.setStyle = function setStyle(styles) {
      var hasOpacity, key, value, opacity, elemStyle = this.style;

      if (isString(styles)) {
        if (styles.indexOf('opacity:') > -1) {
          plugin.setOpacity.call(this, styles.match(reOpacity)[1]);
          styles = styles.replace(reOpacity, '');
        }
        // IE and Konqueror bug-out when setting overflow via cssText
        if (styles.indexOf('overflow:') > -1) {
          elemStyle.overflow = styles.match(reOverflow)[1];
          styles = styles.replace(reOverflow, '');
        }
        elemStyle.cssText += ';' + styles;
        return this;
      }

      if (isHash(styles)) {
        styles = styles._object;
      }

      if (hasOpacity = 'opacity' in styles) {
        opacity = styles.opacity;
        plugin.setOpacity.call(this, opacity);
        delete styles.opacity;
      }

      for (key in styles) {
        value = String(styles[key] || ''); key = camelize(key);
        elemStyle[FLOAT_TRANSLATIONS[key] || key] = value;
      }

      if (hasOpacity) {
        styles.opacity = opacity;
      }
      return this;
    };


    // fallback for browsers without computedStyle or currentStyle
    if (!envTest('ELEMENT_COMPUTED_STYLE') && !envTest('ELEMENT_CURRENT_STYLE')) {
      plugin.getStyle = function getStyle(name) {
        var result = getValue(this, camelize(name));
        return result === null ? result : fuse.String(result);
      };
    }
    // Opera 9.2x
    else if (envTest('ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX')) {
      plugin.getStyle = function getStyle(name) {
        name = camelize(name);
        var dim, element = this.raw || this, result = null;

        if (!isNull(element, name)) {
          if (DIMENSION_NAMES[name]) {
            dim = name == 'width' ? 'Width' : 'Height';
            result = getComputedStyle(element, name);
            if ((parseFloat(result) || 0) === element['offset' + dim]) {
              result = plugin['get' + dim].call(this, 'content') + 'px';
            }
          } else {
            result = getComputedStyle(element, name);
          }
        }
        return result === null ? result : fuse.String(result);
      };
    }
    // Firefox, Safari, Opera 9.5+
    else if (envTest('ELEMENT_COMPUTED_STYLE')) {
      plugin.getStyle = function getStyle(name) {
        name = camelize(name);
        var element = this.raw || this, result = null;

        if (!isNull(element, name)) {
          result = getComputedStyle(element, name);
        }
        return result === null ? result : fuse.String(result);
      };
    }
    // IE
    else {
      // We need to insert into element a span with the M character in it.
      // The element.offsetHeight will give us the font size in px units.
      // Inspired by Google Doctype:
      // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
      var span = fuse._doc.createElement('span');
      span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
      span.appendChild(fuse._doc.createTextNode('M'));

      plugin.getStyle = function getStyle(name) {
        var currStyle, element, elemStyle, runtimeStyle, runtimePos,
         stylePos, pos, size, unit, result;

        // handle opacity
        if (name == 'opacity') {
          result = String(plugin.getOpacity.call(this));
          return fuse.String(result.indexOf('.') < 0
            ? result + '.0'
            : result);
        }

        element = this.raw || this;
        name = camelize(name);

        // get cascaded style
        name      = FLOAT_TRANSLATIONS[name] || name;
        elemStyle = element.style;
        currStyle = element.currentStyle || elemStyle;
        result    = currStyle[name];

        // handle auto values
        if (result == 'auto') {
          if (DIMENSION_NAMES[name] && currStyle.display != 'none') {
            result = plugin['get' +
              (name == 'width' ? 'Width' : 'Height')].call(this, 'content') + 'px';
          } else {
            return null;
          }
        }
        // If the unit is something other than a pixel (em, pt, %),
        // set it on something we can grab a pixel value from.
        // Inspired by Dean Edwards' comment
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
        else if (!NON_PX_NAMES[name] && reNonPxUnit.test(result)) {
          if (name == 'fontSize') {
            unit = result.match(reUnit)[0];
            if (unit == '%') {
              size = element.appendChild(span).offsetHeight;
              element.removeChild(span);
              return fuse.String(Math.round(size) + 'px');
            }
            else if (RELATIVE_CSS_UNITS[unit]) {
              elemStyle = (element = element.parentNode).style;
            }
          }

          runtimeStyle = element.runtimeStyle;

          // backup values
          pos = name == 'height' ? 'top' : 'left';
          stylePos = elemStyle[pos];
          runtimePos = runtimeStyle[pos];

          // set runtimeStyle so no visible shift is seen
          runtimeStyle[pos] = stylePos;
          elemStyle[pos] = result;

          // pixelLeft/pixelTop are not affected by runtimeStyle
          result = elemStyle['pixel' + (pos == 'top' ? 'Top' : 'Left')] + 'px';

          // revert changes
          elemStyle[pos] = stylePos;
          runtimeStyle[pos] = runtimePos;
        }
        return fuse.String(result);
      };
    }

    // prevent JScript bug with named function expressions
    var getStyle = null, setStyle = null;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  // Note: For performance we normalize all spaces to \x20.
  // http://www.w3.org/TR/html5/infrastructure.html#space-character
  (function(plugin) {

    var split      = fuse.String.plugin.split,
     reEdgeSpaces  = /[\t\n\r\f]/g,
     reExtraSpaces = /\x20{2,}/g;

    plugin.addClassName = function addClassName(className) {
      if (!plugin.hasClassName.call(this, className)) {
        var element = this.raw || this;
        element.className += (element.className ? ' ' : '') + className;
      }
      return this;
    };

    plugin.getClassNames = function getClassNames() {
      var element = this.raw || this, cn = element.className;
      return cn.length
        ? split.call(cn.replace(reEdgeSpaces, ' ').replace(reExtraSpaces, ' '), ' ')
        : fuse.Array();
    };

    plugin.hasClassName = function hasClassName(className) {
      var element = this.raw || this, cn = element.className;
      return !!cn.length &&
        (cn == className ||
        (' ' + cn.replace(reEdgeSpaces, ' ') + ' ')
        .indexOf(' ' + className + ' ') > -1);
    };

    plugin.removeClassName = function removeClassName(className) {
      var classNames, length, element = this.raw || this,
       cn = element.className, i = -1, j = i, result = [];

      if (cn.length) {
        classNames = cn.replace(reEdgeSpaces, ' ').split(' ');
        length = classNames.length;

        while (++i < length) {
          cn = classNames[i];
          if (cn != className) result[++j] = cn;
        }
        element.className = result.join(' ');
      }
      return this;
    };

    plugin.toggleClassName = function toggleClassName(className) {
      return plugin[plugin.hasClassName.call(this, className) ?
        'removeClassName' : 'addClassName'].call(this, className);
    };

    // prevent JScript bug with named function expressions
    var addClassName = null,
     getClassNames =   null,
     hasClassName =    null,
     removeClassName = null,
     toggleClassName = null;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var TABLE_ELEMENTS = { 'THEAD': 1, 'TBODY': 1, 'TR': 1 },

    OPACITY_PROP = (function(s) {
      return typeof s.opactiy  != 'undefined' ? 'opacity'       :
        typeof s.MozOpacity    != 'undefined' ? 'MozOpacity'    :
        typeof s.WebkitOpacity != 'undefined' ? 'WebKitOpacity' :
        typeof s.KhtmlOpacity  != 'undefined' ? 'KhtmlOpacity'  : false;
    })(fuse._div.style);


    plugin.getDimensions = function getDimensions(options) {
      return {
        'width':  plugin.getWidth.call(this, options),
        'height': plugin.getHeight.call(this, options)
      };
    };

    plugin.hide = function hide() {
      var element = this.raw || this,
       elemStyle = element.style,
       display = elemStyle.display;

      if (display && display != 'none') {
        domData[getFuseId(element)].madeHidden = display;
      }
      elemStyle.display = 'none';
      return this;
    };

    plugin.show = function show() {
      var data, element = this.raw || this,
       elemStyle = element.style,
       display = elemStyle.display;

      if (display == 'none') {
        data = domData[getFuseId(element)],
        elemStyle.display = data.madeHidden || '';
        delete data.madeHidden;
      }
      return this;
    };

    plugin.toggle = function toggle() {
      return plugin[plugin.isVisible.call(this) ? 'hide' : 'show'].call(this);
    };

    plugin.getOpacity = (function() {
      var getOpacity = function getOpacity() {
        return fuse.Number(parseFloat(this.style[OPACITY_PROP]));
      };

      if (envTest('ELEMENT_MS_CSS_FILTERS')) {
        var reFilterOpacity = /alpha\(opacity=(.*)\)/;
        getOpacity = function getOpacity() {
          var element = this.raw || this,
           result = (element.currentStyle || element.style).filter.match(reFilterOpacity);
          return fuse.Number(result && result[1] ? parseFloat(result[1]) / 100 : 1.0);
        };
      }
      else if (!OPACITY_PROP) {
        getOpacity = function getOpacity() {
          return fuse.Number(1);
        };
      }
      else if (envTest('ELEMENT_COMPUTED_STYLE')) {
        getOpacity = function getOpacity() {
          var element = this.raw || this,
           style = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return fuse.Number(parseFloat(style
            ? style.opacity
            : element.style[OPACITY_PROP]));
        };
      }

      return getOpacity;
    })();

    plugin.setOpacity = (function() {
      var nearOne = 0.99999,
       nearZero   = 0.00001,
       reAlpha    = /alpha\([^)]*\)/i;

      var setOpacity = function setOpacity(value) {
        if (value > nearOne) {
          value = 1;
        } if (value < nearZero && !isString(value)) {
          value = 0;
        }
        this.style[OPACITY_PROP] = value;
        return this;
      };

      if (envTest('ELEMENT_MS_CSS_FILTERS')) {
        setOpacity = function setOpacity(value) {
          // strip alpha from filter style
          var element = this.raw || this,
           elemStyle  = element.style,
           currStyle  = element.currentStyle || elemStyle,
           filter     = currStyle.filter.replace(reAlpha, ''),
           zoom       = currStyle.zoom;

          if (value > nearOne || value == '' && isString(value)) {
            value = 1;
          } if (value < nearZero) {
            value = 0;
          }

          if (value === 1) {
            if (filter) {
              elemStyle.filter = filter;
            } else {
              elemStyle.removeAttribute('filter');
            }
          } else {
            // force layout for filters to work
            if (!(currStyle && currStyle.hasLayout || zoom && zoom != 'normal')) {
              elemStyle.zoom = 1;
            }
            elemStyle.filter = filter + 'alpha(opacity=' + (value * 100) + ')';
          }
          return this;
        };
      }
      else if (!OPACITY_PROP) {
        setOpacity = function setOpacity(value) { /* do nothing */ };
      }

      return setOpacity;
    })();

    plugin.isVisible = function isVisible() {
      if (!fuse._body) return false;

      var isVisible = function isVisible() {
        // handles IE and the fallback solution
        var element = this.raw || this, currStyle = element.currentStyle;
        return currStyle !== null && (currStyle || element.style).display != 'none' &&
          !!(element.offsetHeight || element.offsetWidth);
      };

      if (envTest('ELEMENT_COMPUTED_STYLE')) {
        isVisible = function isVisible() {
          var element = this.raw || this,
           compStyle = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return !!(compStyle && (element.offsetHeight || element.offsetWidth));
        };
      }
      if (envTest('TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN')) {
        var __isVisible = isVisible;
        isVisible = function isVisible() {
          if (__isVisible.call(this)) {
            var element = this.raw || this, nodeName = getNodeName(element);
            if (TABLE_ELEMENTS[nodeName] && (element = element.parentNode)) {
              return isVisible.call(element);
            }
            return true;
          }
          return false;
        };
      }

      // redefine and execute
      plugin.isVisible = isVisible;
      return isVisible.call(this);
    };

    // prevent JScript bug with named function expressions
    var getDimensions = null,
     hide =             null,
     isVisible =        null,
     show =             null,
     toggle =           null;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  // define Element#getWidth and Element#getHeight
  (function(plugin) {

    var PRESETS = {
      'box':     { 'border':  1, 'margin':  1, 'padding': 1 },
      'visual':  { 'border':  1, 'padding': 1 },
      'client':  { 'padding': 1 },
      'content': {  }
    },

    HEIGHT_WIDTH_STYLE_SUMS = {
      'Height': {
        'border':  ['borderTopWidth', 'borderBottomWidth'],
        'margin':  ['marginTop',      'marginBottom'],
        'padding': ['paddingTop',     'paddingBottom']
      },
      'Width': {
        'border':  ['borderLeftWidth', 'borderRightWidth'],
        'margin':  ['marginLeft',      'marginRight'],
        'padding': ['paddingLeft',     'paddingRight']
      }
    },

    i = -1;

    while (++i < 2) (function() {
      var dim = i ? 'Width' : 'Height',

      property = 'offset' + dim,

      STYLE_SUMS = HEIGHT_WIDTH_STYLE_SUMS[dim],

      getSum = function(decorator, name) {
        var styles = STYLE_SUMS[name];
        return (parseFloat(plugin.getStyle.call(decorator, styles[0])) || 0) +
          (parseFloat(plugin.getStyle.call(decorator, styles[1])) || 0);
      },

      getDimension = function getDimension(options) {
        var backup, elemStyle, isGettingSum, result;

        // default to `visual` preset
        if (!options) {
          options = PRESETS.visual;
        }
        else if (options && isString(options)) {
          if (STYLE_SUMS[options]) {
            isGettingSum = true;
          } else {
            options = PRESETS[options];
          }
        }

        // the offsetHeight/offsetWidth properties return 0 on elements
        // with display:none, so show the element temporarily
        if (!plugin.isVisible.call(this)) {
          elemStyle = this.style;
          backup = elemStyle.cssText;
          elemStyle.cssText += ';display:block;visibility:hidden;';

          // exit early when returning style sums
          if (isGettingSum) {
            result = getSum(this, options);
            elemStyle.cssText = backup;
            return fuse.Number(result);
          }
          result = (this.raw || this)[property];
          elemStyle.cssText = backup;
        }
        else if (isGettingSum) {
          return fuse.Number(getSum(this, options));
        }
        else {
          result = (this.raw || this)[property];
        }

        // add margins because they're excluded from the offset values
        if (options.margin) {
          result += getSum(this, 'margin');
        }
        // subtract border and padding because they're included in the offset values
        if (!options.border) {
          result -= getSum(this, 'border');
        }
        if (!options.padding) {
          result -= getSum(this, 'padding');
        }
        return fuse.Number(result);
      };

      plugin['get' + dim] = getDimension;
    })();

    // cleanup
    i = undef;
  })(Element.plugin);

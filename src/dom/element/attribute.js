  /*--------------------------- ELEMENT: ATTRIBUTE ---------------------------*/

  Element.Attribute = {
    'contentNames': { },
    'read':         { },
    'write':        { },
    'names':        { }
  };

  (function(plugin) {

    var CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 },

    PROP_DEFAULTS = { 'selected': 'defaultSelected', 'value': 'defaultValue' },

    TAG_PROPS_WITH_DEFAULTS = { 'OPTION': 'selected', 'TEXTAREA': 'value' };


    plugin.hasAttribute = function hasAttribute(name) {
      return (this.raw || this).hasAttribute(name);  
    };

    plugin.getAttribute = function getAttribute(name) {
      var result, T = Element.Attribute,
       element = this.raw || this,
       contentName = T.contentNames[name] || name;

      name = T.names[name] || name;
      if (T.read[name]) {
        result = T.read[name](element, contentName);
      } else {
        result = (result = element.getAttributeNode(name)) && result.value;
      }
      return fuse.String(result || '');
    };

    plugin.removeAttribute = function removeAttribute(name) {
      (this.raw || this).removeAttribute(Element.Attribute.contentNames[name] || name);
      return this;
    };

    plugin.setAttribute = function setAttribute(name, value) {
      var contentName, isRemoved, node,
       element = this.raw || this, attributes = { }, T = Element.Attribute;

      if (isHash(name)) {
        attributes = name._object;
      } else if (!isString(name)) {
        attributes = name;
      } else {
        attributes[name] = (typeof value === 'undefined') ? true : value;
      }

      for (name in attributes) {
        value = attributes[name];
        contentName = T.contentNames[name] || name;
        name = T.names[name] || name;
        isRemoved = value === false || value == null;

        if (T.write[name]) {
          if (T.write[name](element, value, isRemoved) === false) {
            element.removeAttribute(contentName);
          }
        }
        else if (isRemoved) {
          element.removeAttribute(contentName);
        }
        else {
          element.setAttribute(contentName,
            value === true ? name : String(value));
        }
      }
      return this;
    };

    // For IE
    if (!envTest('ELEMENT_HAS_ATTRIBUTE')) {
      plugin.hasAttribute = function hasAttribute(name) {
        var defaultProp, node = this.raw || this,
         nodeName = getNodeName(node);

        if (nodeName === 'INPUT') {
          if (name == 'value') {
            defaultProp = 'defaultValue';
          } else if (name == 'checked' && CHECKED_INPUT_TYPES[node.type]) {
            defaultProp = 'defaultChecked';
          }
        } else if (TAG_PROPS_WITH_DEFAULTS[nodeName] == name) {
          defaultProp = PROP_DEFAULTS[name];
        }

        if (defaultProp) {
          return !!node[defaultProp];
        }
        // IE6/7 fails to detect value attributes as well as colspan and rowspan
        // attributes with a value of 1
        node = node.getAttributeNode(Element.Attribute.names[name] || name);
        return !!node && node.specified;
      };
    }

    // prevent JScript bug with named function expressions
    var getAttribute = null,
     hasAttribute =    null,
     setAttribute =    null,
     removeAttribute = null;
  })(Element.plugin);

  /*--------------------------------------------------------------------------*/

  (function(T) {
    var plugin = Element.plugin,

    getAttribute = function(element, contentName) {
      return element.getAttribute(contentName);
    },

    getDefault = function(capitalName) {
      var defaultName = 'default' + capitalName, lower = capitalName.toLowerCase();
      return function(element) {
        return element[defaultName] && lower;
      };
    },

    getEvent = function(element, name) {
      var node = element.getAttributeNode(name);
      return node && node.specified && node.value;
    },

    getExact = function(element, contentName) {
      // `iFlags` as 2 returns the value exactly as it was set in script or in the source document
      // http://web.archive.org/web/20080508155143/http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
      return element.getAttribute(contentName, 2);
    },

    getFlag = function(contentName) {
      var lower = contentName.toLowerCase();
      return function(element) {
        return plugin.hasAttribute.call(element, contentName) && lower;
      };
    },

    getStyle = function(element) {
      return element.style.cssText.toLowerCase();
    },

    getValue = function(element) {
      return element.defaultValue;
    },

    setDefault = function(capitalName) {
      var defaultName = 'default' + capitalName, lower = capitalName.toLowerCase();
      return function(element, value) {
        // contentName is used for setAttribute in IE6/7 but
        // in this case the relevant names aren't camel-cased to begin with
        element[defaultName] = !!value;
        value && element.setAttribute(lower, lower);
      };
    },

    setFlag = function(contentName) {
      var lower = contentName.toLowerCase();
      return function(element, value, remove) {
        if (remove) return false;
        element.setAttribute(contentName, lower);
      };
    },

    setNode = function(name) {
      return function(element, value, remove) {
        if (remove) return false;
        var attr = element.getAttributeNode(name);
        if (!attr) {
          attr = element.ownerDocument.createAttribute(name);
          element.setAttributeNode(attr);
        }
        attr.value = String(value);
      };
    },

    setStyle = function(element, value) {
      element.style.cssText = String(value || '');
    },

    setValue = function(element, value, remove) {
      element.defaultValue = remove ? null : value;
    },

    splitEach = function(string, callback) {
      var array = string.split(' '), i = -1;
      while (array[++i]) callback(array[i]);
    };

    // mandate type getter
    T.read.type = getAttribute;

    // mandate getter/setter for checked and selected attributes
    // http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-37770574
    T.read.checked   = getDefault('Checked');
    T.write.checked  = setDefault('Checked');
    T.read.selected  = getDefault('Selected');
    T.write.selected = setDefault('Selected');

    // mandate flag attributes set and return their name
    splitEach('disabled isMap multiple noHref noResize noShade ' +
      'noWrap readOnly',
      function(contentName) {
        var lower = contentName.toLowerCase();
        T.read[lower]  = getFlag(contentName);
        T.write[lower] = setFlag(contentName);
    });

    // mandate event attribute getter
    splitEach('blur change click contextmenu dblclick error focus load keydown ' +
      'keypress keyup mousedown mousemove mouseout mouseover mouseup ' +
      'readystatechange reset submit select unload',
      function(name) {
        T.read['on' + name] = getEvent;
    });

    // mandate getAttribute/setAttribute for value
    // http://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26091157
    Element.extendByTag(['input', 'textarea'], function() {
      var __getAttribute = plugin.getAttribute,
       __setAttribute = plugin.setAttribute,

      getAttribute = function getAttribute(name) {
        return name == 'value'
          ? getValue(this.raw || this)
          : __getAttribute.call(this, name);
      },

      setAttribute = function setAttribute(name, value) {
        name == 'value'
          ? setValue(this.raw || this, value)
          : __setAttribute.call(this, name, value);
        return this;
      };

      return { 'getAttribute': getAttribute, 'setAttribute': setAttribute };
    });
 
    // capability checks
    (function() {
      var checkbox, input, node, value,
       doc   = fuse._doc,
       form  = doc.createElement('form'),
       label = doc.createElement('label');

      label.htmlFor = label.className = 'x';
      label.setAttribute('style', 'display:block');
      form.setAttribute('enctype', 'multipart/form-data');

      // translate content name `htmlFor`
      if (label.getAttribute('htmlFor') === 'x') {
        T.contentNames['for'] = 'htmlFor';
      } else {
        T.contentNames.htmlFor = 'for';
      }

      // translate content name `className`
      if (label.getAttribute('className') === 'x') {
        T.contentNames['class'] = 'className';
      } else {
        T.contentNames.className = 'class';
      }

      // set `encType`
      if ((node = form.getAttributeNode('enctype')) &&
          node.value !== 'multipart/form-data') {
        T.write.enctype = setNode('encType');
      }

      // getter/setter for `style` attribute
      value = (node = label.getAttributeNode('style')) && node.value;
      if (typeof value !== 'string' || value.lastIndexOf('display:block', 0)) {
        T.read.style  = getStyle;
        T.write.style = setStyle;
      }

      // Get URI attributes, excluding the `action` attribute because
      // Opera 9.25 automatically translates the URI from relative to absolute
      // and IE will have the reverse effect.
      // TODO: Check others attributes like background, BaseHref, cite, codeBase,
      // data, dynsrc, lowsrc, pluginspage, profile, and useMap.
      if (envTest('ELEMENT_GET_ATTRIBUTE_IFLAG')) {
        splitEach('href longdesc src', function(name) { T.read[name] = getExact; });
      }
    })();

    // setter for button element value
    if (envTest('BUTTON_VALUE_CHANGES_AFFECT_INNER_CONTENT')) {
      Element.extendByTag('button', function() {
        var __setAttribute = plugin.setAttribute,
         setValue = setNode('value'),

        setAttribute = function setAttribute(name, value) {
          name == 'value'
            ? setValue(this.raw || this, value)
            : __setAttribute.call(this, name, value);
          return this;
        };

        return { 'setAttribute': setAttribute };
      });
    }

    // add camel-cased contentName translations for IE6/7
    if (T.contentNames['class'] || T.contentNames['for']) {
      splitEach('bgColor codeBase codeType cellPadding cellSpacing colSpan ' +
        'rowSpan vAlign vLink aLink dateTime accessKey tabIndex encType ' +
        'maxLength readOnly longDesc frameBorder isMap useMap noHref noResize ' +
        'noShade noWrap marginWidth marginHeight',
        function(contentName) {
          var lower = contentName.toLowerCase();
          T.contentNames[lower] = contentName;
          T.names[contentName]  = lower;
      });
    }
  })(Element.Attribute);

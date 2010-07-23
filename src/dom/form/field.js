  /*--------------------------------- FIELD ----------------------------------*/

  (function(dom) {
    // create form control classes
    (function() {
      var tagName, i = -1,
       tagNames = ['button', 'input', 'option', 'select', 'textarea'];
      while (tagName = tagNames[++i]) {
        Element.extendByTag(tagName);
      }
    })();

    var dom        = fuse.dom,

    buttonPlugin   = dom.ButtonElement.plugin,

    inputPlugin    = dom.InputElement.plugin,

    optionPlugin   = dom.OptionElement.plugin,

    selectPlugin   = dom.SelectElement.plugin,

    textAreaPlugin = dom.TextAreaElement.plugin,

    CHECKED_INPUT_TYPES = {
      'checkbox': 1,
      'radio':    1
    },

    INPUT_BUTTONS = {
      'button': 1,
      'image':  1,
      'reset':  1,
      'submit': 1
    },

    PLUGINS = {
      'BUTTON':   buttonPlugin,
      'INPUT':    inputPlugin,
      'OPTION':   optionPlugin,
      'SELECT':   selectPlugin,
      'TEXTAREA': textAreaPlugin
    },

    getOptionValue = function getValue() {
      return fuse.String((this.raw || this)[optionPlugin.hasAttribute.call(this, 'value')
        ? 'value'
        : 'text'] || '');
    };


    /* define common field class methods */

    selectPlugin.initialize = function initialize() {
      this.options = this.raw.options;
    };

    buttonPlugin.activate =
    selectPlugin.activate = function activate() {
      try { (this.raw || this).focus(); } catch(e) { }
      return this;
    };

    textAreaPlugin.activate =
    inputPlugin.activate = function activate() {
      var element = this.raw || this;
      try { element.focus(); } catch(e) { }
      if (element.select && !INPUT_BUTTONS[element.type]) {
        element.select();
      }
      return this;
    };

    selectPlugin.clear =
    textAreaPlugin.clear = function clear() {
      return PLUGINS[getNodeName(this.raw || this)].setValue.call(this, null);
    };

    inputPlugin.clear = function clear() {
      var element = this.raw || this, type = element.type;
      if (CHECKED_INPUT_TYPES[type]) {
        element.checked = false;
      } else if (!INPUT_BUTTONS[type]) {
        PLUGINS[getNodeName(element)].setValue.call(this, null);
      }
      return this;
    };

    buttonPlugin.disable   =
    selectPlugin.disable   =
    textAreaPlugin.disable =
    inputPlugin.disable = function disable() {
      (this.raw || this).disabled = true;
      return this;
    };

    buttonPlugin.enable   =
    selectPlugin.enable   =
    textAreaPlugin.enable =
    inputPlugin.enable = function enable() {
      (this.raw || this).disabled = false;
      return this;
    };

    buttonPlugin.focus   =
    selectPlugin.focus   =
    textAreaPlugin.focus =
    inputPlugin.focus = function focus() {
      // avoid IE errors when element or ancestors are not rendered
      try { (this.raw || this).focus(); } catch(e) { }
      return this;
    };

    textAreaPlugin.present =
    inputPlugin.present = function present() {
      return !!(this.raw || this).value;
    };

    buttonPlugin.serialize   =
    textAreaPlugin.serialize =
    inputPlugin.serialize = function serialize() {
      var pair, name, nodeName, element = this.raw || this;
      if (element.disabled || !(name = element.name)) {
        return fuse.String('');
      }
      pair = { };
      pair[name] = PLUGINS[getNodeName(element)].getValue.call(this);
      return fuse.Object.toQueryString(pair);
    };

    selectPlugin.serialize = function serialize() {
      var value, pair, name, nodeName, element = this.raw || this;
      if (element.disabled || !(name = element.name) ||
          element.selectedIndex == -1) {
        return fuse.String('');
      }
      value = selectPlugin.getValue.call(this);
      if (isArray(value) && value.length < 2) {
        value = value[0];
      }
      pair = { };
      pair[name] = value;
      return fuse.Object.toQueryString(pair);
    };

    textAreaPlugin.select =
    inputPlugin.select = function select() {
      (this.raw || this).select();
      return this;
    };


    /* define getValue/setValue for each field class */

    buttonPlugin.getValue   =
    textAreaPlugin.getValue = function getValue() {
      return fuse.String((this.raw || this).value || '');
    };

    inputPlugin.getValue = function getValue() {
      var element = this.raw || this,
        fallback = CHECKED_INPUT_TYPES[element.type] ? 'on' : '';
      return fuse.String(element.value || fallback);
    };

    buttonPlugin.setValue   =
    textAreaPlugin.setValue =
    optionPlugin.setValue   =
    inputPlugin.setValue = function setValue(value) {
      (this.raw || this).value = value || '';
      return this;
    };

    selectPlugin.getValue = function getValue() {
      var i, node, result, element = this.raw || this;
      if (element.type == 'select-one') {
        var index = element.selectedIndex;
        if (index > -1) result = getOptionValue.call(element.options[index]);
      }
      else if (element.options.length) {
        result = fuse.Array(); i = 0;
        while (node = element.options[i++]) {
          if (node.selected) result.push(getOptionValue.call(node));
        }
      }
      else {
        result = fuse.String('');
      }
      return result;
    };

    selectPlugin.setValue = function setValue(value) {
      var node, i = -1, element = this.raw || this;
      if (value === null) {
        element.selectedIndex = -1;
      }
      else if (isArray(value)) {
        // quick indexOf
        value = uid + value.join(uid) + uid;
        while (node = element.options[++i]) {
          node.selected = value.indexOf(uid + getOptionValue.call(node) + uid) > -1;
        }
      }
      else {
        value = String(value);
        while (node = element.options[++i]) {
          if (getOptionValue.call(node) == value) {
            node.selected = true;
            break;
          }
        }
      }
      return this;
    };

    optionPlugin.getValue = getOptionValue;

    // handle IE6/7 bug with button elements
    if (envTest('BUTTON_VALUE_CHANGES_AFFECT_INNER_CONTENT')) {
      buttonPlugin.getValue = function getValue() {
        return buttonPlugin.getAttribute.call(this, 'value');
      };

      buttonPlugin.setValue = function setValue(value) {
        return buttonPlugin.setAttribute.call(this, 'value', value);
      };
    }

    // prevent JScript bug with named function expressions
    var initialize = null,
     activate =      null,
     clear =         null,
     disable =       null,
     enable =        null,
     focus =         null,
     getValue =      null,
     present =       null,
     select =        null,
     setValue =      null,
     serialize =     null;
  })();

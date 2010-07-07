  /*---------------------------------- FORM ----------------------------------*/

  Element.extendByTag('form');

  (function(plugin) {

    var Obj        = fuse.Object,

    dom            = fuse.dom,

    buttonPlugin   = dom.ButtonElement.plugin,

    inputPlugin    = dom.InputElement.plugin,

    optionPlugin   = dom.OptionElement.plugin,

    selectPlugin   = dom.SelectElement.plugin,

    textAreaPlugin = dom.TextAreaElement.plugin,

    CHECKED_INPUT_TYPES = {
      'checkbox': 1,
      'radio':    1
    },

    CONTROL_NODE_NAMES = {
      'BUTTON':   1,
      'INPUT':    1,
      'SELECT':   1,
      'TEXTAREA': 1
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

    SKIPPED_INPUT_TYPES = {
      'file': 1,
      'reset': 1
    },

    eachElement = function(element, callback) {
      var node, i = 0,
       nodes = (element.raw || element).getElementsByTagName('*');

      if (node = nodes[0]) {
        do {
          CONTROL_NODE_NAMES[getNodeName(node)] && callback(node);
        } while (node = nodes[++i]);
      }
    };

    plugin.initialize = function initialize() {
      this.options = this.raw.options;
    };

    plugin.disable = function disable() {
      eachElement(this, function(node) { node.disabled = true; });
      return this;
    };

    plugin.enable = function enable() {
      eachElement(this, function(node) { node.disabled = false; });
      return this;
    };

    plugin.getFirstControl = function getFirstControl() {
      var firstByIndex, result, tabIndex,
       firstNode = null, minTabIndex = Infinity;

      eachElement(this, function(node) {
        if (node.type !== 'hidden' && !node.disabled) {
          if (!firstNode) {
            firstNode = node;
          }
          if ((tabIndex = node.tabIndex) > -1 && tabIndex < minTabIndex) {
            minTabIndex  = tabIndex;
            firstByIndex = node;
          }
        }
      });

      result = firstByIndex || firstNode;
      return result && fromElement(result);
    };

    plugin.focusFirstControl = function focusFirstControl() {
      var element = plugin.getFirstControl.call(this);
      if (element) {
        try { (element.raw || element).focus(); } catch(e) { }
      }
      return this;
    };

    plugin.getControls = function getControls() {
      var node, result = NodeList(), i = 0, j = -1,
       nodes = (this.raw || this).getElementsByTagName('*');

      if (node = nodes[0]) {
        do {
          if (CONTROL_NODE_NAMES[node.nodeName.toUpperCase()])
            result[++j] = fromElement(node);
        } while (node = nodes[++i]);
      }
      return result;
    };

    plugin.getInputs = function getInputs(typeName, name) {
      typeName = String(typeName || '');
      name = String(typeName || '');

      var input, inputs = (this.raw || this).getElementsByTagName('input'),
       result = NodeList(), i = -1, j = i;

      if (!typeName && !name) {
        while (input = inputs[++i]) {
          result[i] = fromElement(input);
        }
      }
      else if (typeName && !name) {
        while (input = inputs[++i]) {
          if (typeName === input.type)
            result[++j] = fromElement(input);
        }
      }
      else {
        while (input = inputs[++i]) {
          if ((!typeName || typeName === input.type) && (!name || name === input.name))
            result[++j] = fromElement(input);
        }
      }
      return result;
    };

    plugin.request = function request(options) {
      options = Obj.clone(options);
      var params = options.parameters, submit = options.submit;

      delete options.submit;
      options.parameters = plugin.serialize.call(this, { 'submit':submit, 'hash':true });

      if (params) {
        if (isString(params)) params = fuse.String.toQueryParams(params);
        Obj.extend(options.parameters, params);
      }
      if (plugin.hasAttribute.call(this, 'method') && !options.method) {
        options.method = plugin.getAttribute.call(this, 'method');
      }
      return fuse.ajax.Request(plugin.getAttribute.call(this, 'action'), options);
    };

    plugin.reset = function reset() {
      (this.raw || this).reset();
      return this;
    };

    plugin.serialize = function serialize(options) {
      return plugin.serializeElements.call(this, null, options);
    };

    plugin.serializeElements = function serializeElements(elements, options) {
      if (typeof options !== 'object') {
        options = { 'hash': !!options };
      } else if (typeof options.hash === 'undefined') {
        options.hash = true;
      }

      var isImageType, isSubmitButton, key, nodeName, prefix,
       submitSerialized, type, value, i = 0,
       element     = this.raw || this,
       checkString = !!elements,
       doc         = getDocument(element),
       result      = Obj(),
       submit      = options.submit;

      if (submit && submit.raw) {
        submit = submit.raw;
      }
      if (!elements) {
        elements = element.getElementsByTagName('*');
      }
      if (!elements.length) {
        elements = [element];
      }
      if (element = elements[0]) {
        do {
          // avoid checking for element ids if we are iterating the default nodeList
          if (checkString && isString(element) &&
             !(element = doc.getElementById(element))) {
            continue;
          } else {
            element = element.raw || element;
          }

          // skip if not a form control
          nodeName = getNodeName(element);
          if (!CONTROL_NODE_NAMES[nodeName]) {
            continue;
          }

          key            = element.name;
          type           = element.type;
          isImageType    = type === 'image';
          isSubmitButton = type === 'submit' || isImageType;

          if (element.disabled ||                                         // skip disabled
              SKIPPED_INPUT_TYPES[type] ||                                // skip file/reset controls
              CHECKED_INPUT_TYPES[type] && !element.checked ||            // skip unchecked
              nodeName === 'SELECT' && element.selectedIndex === -1 ||    // skip unselected
              (isSubmitButton && (submit === false || submitSerialized || // skip non-active submit buttons
                (submit && !(key === submit || element === submit))))) {
            continue;
          }

          if (isSubmitButton) {
            submitSerialized = true;
            if (isImageType) {
              var prefix = key ? key + '.' : '',
               x = options.x || 0, y = options.y || 0;
              result[prefix + 'x'] = x;
              result[prefix + 'y'] = y;
            }
          }
          // skip unnamed
          if (!key) {
            continue;
          }

          value = PLUGINS[nodeName].getValue.call(element);
          if (isArray(value) && value.length < 2) {
            value = value[0];
          }

          // property exists and and belongs to result
          if (hasKey(result, key)) {
            // a key is already present; construct an array of values
            if (!isArray(result[key])) result[key] = [result[key]];
            result[key].push(value);
          } else {
            result[key] = value;
          }
        }
        while (element = elements[++i]);
      }

      return options.hash
        ? result
        : Obj.toQueryString(result);
    };

    // prevent JScript bug with named function expressions
    var initialize =     null,
     disable =           null,
     enable =            null,
     getFirstControl =   null,
     focusFirstControl = null,
     getControls =       null,
     getInputs =         null,
     request =           null,
     reset =             null,
     serializeElements = null,
     serialize =         null;
  })(fuse.dom.FormElement.plugin);
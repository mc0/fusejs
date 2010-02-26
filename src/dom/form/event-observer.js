  /*-------------------------- FORM: EVENT OBSERVER --------------------------*/

  (function() {
    var BaseEventObserver = Class({
      'constructor': (function() {
        function BaseEventObserver(element, callback) {
          this.element = fuse.get(element);
          element = element.raw || element;

          var eventObserver = this, onElementEvent = this.onElementEvent;
          this.onElementEvent = function() { onElementEvent.call(eventObserver); };

          if (getNodeName(element) === 'FORM') {
            return this.registerFormCallbacks();
          }

          var member, name = element.name, i = -1;
          this.group =
            (name && fuse.query(element.nodeName +
            '[name="' + name + '"]', getDocument(element)).get()) ||
            NodeList(fuse.get(element));

          this.callback = callback;
          this.lastValue = this.getValue();

          while (member = this.group[++i]) {
            this.registerCallback(member);
          }
        }
        return BaseEventObserver;
      })()
    });

    (function(plugin) {
      var CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 };

      plugin.onElementEvent = function onElementEvent() {
        var value = this.getValue();
        if (this.lastValue === value) return;
        this.callback(this.element, value);
        this.lastValue = value;
      };

      plugin.registerCallback = function registerCallback(element) {
        element = element.raw || element;
        var type = element.type;
        if (type) {
          Event.observe(element,
            CHECKED_INPUT_TYPES[type] ? 'click' : 'change',
            this.onElementEvent);
        }
      };

      plugin.registerFormCallbacks = function registerFormCallbacks() {
        var element, elements = this.element.getElements(), i= 0;
        while (element = elements[i++]) this.registerCallback(element);
      };

      // prevent JScript bug with named function expressions
      var onElementEvent = nil, registerCallback = nil, registerFormCallbacks = nil;
    })(BaseEventObserver.plugin);

    /*------------------------------------------------------------------------*/

    var Field = fuse.dom.InputElement, getValue = nil;

    Field.EventObserver = (function() {
      function Klass() { }

      function FieldEventObserver(element, callback) {
        var instance = new Klass;
        BaseEventObserver.call(instance, element, callback);
        return instance;
      }

      var FieldEventObserver = Class(BaseEventObserver, { 'constructor': FieldEventObserver });
      Klass.prototype = FieldEventObserver.plugin;
      return FieldEventObserver;
    })();

    Field.EventObserver.plugin.getValue = (function() {
      function getValue() {
        var element, member, value, i = -1;
        if (this.group.length === 1) {
          return this.element.getValue();
        }
        while (member = this.group[++i]) {
          element = member.raw || member;
          if (CHECKED_INPUT_TYPES[element.type]) {
            if (element.checked) {
              return member.getValue();
            }
          } else if (value = member.getValue()) {
            return value;
          }
        }
      }

      var CHECKED_INPUT_TYPES = { 'checkbox': 1, 'radio': 1 };
      return getValue;
    })();

    Form.EventObserver = (function() {
      function Klass() { }

      function FormEventObserver(element, callback) {
        var instance = new Klass;
        BaseEventObserver.call(instance, element, callback);
        return instance;
      }

      var FormEventObserver = Class(BaseEventObserver, { 'constructor': FormEventObserver });
      Klass.prototype = FormEventObserver.plugin;
      return FormEventObserver;
    })();

    Form.plugin.getValue = function getValue() {
      return this.element.serialize();
    };
  })();

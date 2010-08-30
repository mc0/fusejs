  /*-------------------------- FORM: TIMED OBSERVER --------------------------*/

  (function() {
    var BaseTimedObserver = fuse.Class(fuse.Timer, function() {
      var BaseTimedObserver = function BaseTimedObserver(element, callback, interval, options) {
        // this._super() equivalent
        fuse.Timer.call(this, callback, interval, options);

        this.element = fuse(element);
        this.lastValue = this.getValue();
        this.start();
        return this;
      },

      execute = function execute() {
        var value = this.getValue();
        if (String(this.lastValue) != String(value)) {
          this.callback(this.element, value);
          this.lastValue = value;
        }
      };

      return { 'constructor': BaseTimedObserver, 'execute': execute };
    });

    /*------------------------------------------------------------------------*/

    HTMLInputElement.Observer =
    HTMLInputElement.TimedObserver = (function() {
      var Klass = function() { },

      FieldTimedObserver = function FieldTimedObserver(element, callback, interval, options) {
        return BaseTimedObserver.call(new Klass, element, callback, interval, options);
      };

      fuse.Class(BaseTimedObserver, { 'constructor': FieldTimedObserver });
      Klass.prototype = FieldTimedObserver.plugin;
      return FieldTimedObserver;
    })();

    HTMLInputElement.Observer.plugin.getValue = function getValue() {
      return this.element.getValue();
    };

    HTMLFormElement.Observer =
    HTMLFormElement.TimedObserver = (function() {
      var Klass = function() { },

      FormTimedObserver = function FormTimedObserver(element, callback, interval, options) {
        return BaseTimedObserver.call(new Klass, element, callback, interval, options);
      };

      fuse.Class(BaseTimedObserver, { 'constructor': FormTimedObserver });
      Klass.prototype = FormTimedObserver.plugin;
      return FormTimedObserver;
    })();

    HTMLFormElement.Observer.plugin.getValue = function getValue() {
      return this.element.serialize();
    };

    // prevent JScript bug with named function expressions
    var getValue = null;
  })();

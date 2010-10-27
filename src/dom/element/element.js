  /*------------------------------ HTML ELEMENT ------------------------------*/

  // add/pave statics
  (function() {

    var isMixin = false,

    addToNodeList = function() {
      var arg, j, jmax,
       args = arguments, i = -1, imax = args.length,
       Klass = this, prototype = Klass.prototype;

      while (++i < imax) {
        arg = args[i];
        if (typeof arg == 'function') arg = arg();
        if (!fuse.Object.isArray(arg)) arg = [arg];

        j = -1; jmax = arg.length;
        while (++j < jmax) {
          fuse.Object.each(arg[j], function(method, key) {
            if (!isMixin || isMixin && !method.$super) {
              fuse._.addNodeListMethod(method, key, prototype);
            }
          });
        }
      }
      return Klass;
    },

    addMixins = function addMixins() {
      fuse.Class.defaults.statics.addMixins.apply(this, arguments);
      isMixin = true;
      addToNodeList.apply(this, arguments);
      isMixin = false;
      return this;
    },

    addPlugins = function addPlugins() {
      fuse.Class.defaults.statics.addPlugins.apply(this, arguments);
      return addToNodeList.apply(this, arguments);
    };

    Element.addMixins =
    HTMLElement.addMixins = addMixins;

    Element.addPlugins =
    HTMLElement.addPlugins = addPlugins;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {

    var counter = 0;

    plugin.identify = function identify() {
      // use getAttribute to avoid issues with form elements and
      // child controls with ids/names of "id"
      var ownerDoc, element = this.raw || this,
       id = plugin.getAttribute.call(this, 'id');

      if (id != '') return id;
      ownerDoc = element.ownerDocument;
      while (ownerDoc.getElementById(id = 'anonymous_element_' + counter++)) { }

      plugin.setAttribute.call(this, 'id', id);
      return fuse.String(id);
    };

    plugin.isEmpty = function isEmpty() {
      var element = this.raw || this, node = element.firstChild;
      while (node) {
        if (node.nodeType != 3 || node.data != false) {
          return false;
        }
        node = node.nextSibling;
      }
      return true;
    };

    plugin.isDetached = function isDetached() {
      var element = this.raw || this;
      return !(element[PARENT_NODE] &&
        plugin.contains.call(element.ownerDocument, element));
    };

    if (fuse.env.test('ELEMENT_INNER_HTML')) {
      plugin.isEmpty = function isEmpty() {
        return (this.raw || this).innerHTML == false;
      };
    }

    if (fuse.env.test('ELEMENT_SOURCE_INDEX')) {
      plugin.isDetached = function isDetached() {
        var element = this.raw || this;
        return element.ownerDocument.all[element.sourceIndex] != element;
      };
    }
    else if (fuse.env.test('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
      plugin.isDetached = function isDetached() {
        /* DOCUMENT_POSITION_DISCONNECTED = 0x01 */
        var element = this.raw || this;
        return (element.ownerDocument.compareDocumentPosition(element) & 1) == 1;
      };
    }

    // prevent JScript bug with named function expressions
    var identify = null, isDetached = null, isEmpty = null;
  })(Element.plugin);

  /*-------------------------------- ELEMENT ---------------------------------*/

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
        if (!isArray(arg)) arg = [arg];

        j = -1; jmax = arg.length;
        while (++j < jmax) {
          eachKey(arg[j], function(method, key) {
            if (!isMixin || isMixin && !method.$super) {
              addNodeListMethod(method, key, prototype);
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

    Element.addMixins = addMixins;
    Element.addPlugins = addPlugins;
    Element.updateGenerics = Node.updateGenerics;
  })();

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var idCounter = 0;

    plugin.identify = function identify() {
      // use getAttribute to avoid issues with form elements and
      // child controls with ids/names of "id"
      var element = this.raw || this,
       id = plugin.getAttribute.call(this, 'id');
      if (id.length) return id;

      var ownerDoc = element.ownerDocument;
      do { id = 'anonymous_element_' + idCounter++; }
      while (ownerDoc.getElementById(id));

      plugin.setAttribute.call(this, 'id', id);
      return fuse.String(id);
    };

    plugin.isEmpty = function isEmpty() {
      return (this.raw || this).innerHTML == false;
    };

    plugin.isDetached = function isDetached() {
      var element = this.raw || this;
      return !(element[PARENT_NODE] &&
        plugin.contains.call(element.ownerDocument, element));
    };

    if (envTest('ELEMENT_SOURCE_INDEX', 'DOCUMENT_ALL_COLLECTION')) {
      plugin.isDetached = function isDetached() {
        var element = this.raw || this;
        return element.ownerDocument.all[element.sourceIndex] != element;
      };
    }
    else if (envTest('ELEMENT_COMPARE_DOCUMENT_POSITION')) {
      plugin.isDetached = function isDetached() {
        /* DOCUMENT_POSITION_DISCONNECTED = 0x01 */
        var element = this.raw || this;
        return (element.ownerDocument.compareDocumentPosition(element) & 1) == 1;
      };
    }

    // prevent JScript bug with named function expressions
    var identify = null, isDetached = null, isEmpty = null;
  })(Element.plugin);

  /*------------------------------ DOM: WINDOW -------------------------------*/

  Window =
  fuse.dom.Window = (function() {
    var isWindow = function(object) {
      return toString.call(object) === '[object Window]';
    },

    Decorator = function() { },

    Window = function Window(object) {
      // quick return if empty, decorated, or not a window object
      if (!object || object.raw || !isWindow(object)) {
        return object;
      }

      // return cached if available
      var decorated, id = Node.getFuseId(object), data = domData[id];
      if (data.decorator) {
        return data.decorator;
      }

      decorated =
      data.decorator = new Decorator;
      decorated.raw = object;
      return decorated;
    };

    if (!isWindow(global)) {
      // weak fallback
      isWindow = function(object) {
        return typeof object.frameElement !== 'undefined';
      };
    }

    Class({ 'constructor': Window });
    Decorator.prototype = Window.plugin;
    Window.updateGenerics = Node.updateGenerics;
    return Window;
  })();

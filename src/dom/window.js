  /*------------------------------ DOM: WINDOW -------------------------------*/

  Window =
  fuse.dom.Window = (function() {
    var Decorator = function() { },

    Window = function Window(object) {
      // quick return if empty, decorated, or not a window object
      if (!object || object.raw || !('frameElement' in object)) {
        return object;
      }

      // return cached if available
      var decorated, id = Node.getFuseId(object), data = Data[id];
      if (data.decorator) return data.decorator;

      decorated =
      data.decorator = new Decorator;
      decorated.raw = object;
      return decorated;
    };

    Window = Class({ 'constructor': Window });
    Decorator.prototype = Window.plugin;
    Window.updateGenerics = Node.updateGenerics;
    return Window;
  })();

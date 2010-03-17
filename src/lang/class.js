  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, John Resig, T.J. Crowder & Prototype core  */
  /* http://blog.niftysnippets.org/2009/09/simple-efficient-supercalls-in.html*/

  Class =
  fuse.Class = (function() {
    var Subclass = function() { },

    createNamedClass = function(name) {
      return Function(
        'function ' + name + '(){' +
        'var i,c=this;' +
        'return (i=c.initialize)&&i.apply(c,arguments)' +
        '}return ' + name)();
    },

    Class = function Class(Superclass, plugins, mixins, statics) {
      var Klass, arg, plugin, i = 0,
       args = slice.call(arguments, 0),
       first = args[0];

      if (isString(first)) {
        Superclass = createNamedClass(args.shift());
      } else if (typeof first === 'function' && first.subclasses) {
        Superclass = args.shift();
      } else {
        Superclass = null;
      }

      // auto execute plugins if they are closures and convert to array if not already
      plugins = args[0];
      if (typeof plugins === 'function') plugins = plugins();
      if (!isArray(plugins)) plugins = [plugins];

      // search properties for a custom `constructor` method
      while ((plugin = plugins[i++])) {
        if (hasKey(plugin, 'constructor')) {
          if (typeof plugin.constructor === 'function') {
            Klass = plugin.constructor;
          } else if (isString(plugin.constructor)) {
            Klass = createNamedClass(plugin.constructor);
          }
          delete plugin.constructor;
        }
      }

      Klass = Klass || createNamedClass('UnnamedClass');

      if (Superclass) {
        // note: Safari 2, inheritance won't work with Klass.prototype = new Function;
        Subclass.prototype = Superclass.prototype;
        Klass.prototype = new Subclass;
        Superclass.subclasses.push(Klass);
      }

      Klass.superclass = Superclass;
      Klass.subclasses = fuse.Array();
      plugin = Klass.plugin = Klass.prototype;

      // add statics/mixins/plugins to the Klass
      Class.statics
        .addStatics.call(Klass, Class.statics, args[2])
        .addPlugins(plugins)
        .addMixins(Class.mixins, args[1]);

      plugin.constructor = Klass;
      return Klass;
    };

    return Class;
  })();

  /*--------------------------------------------------------------------------*/

  Class.mixins = (function() {
    function callSuper(method) {
      var $super, args, callee = method.callee;
      if (callee) {
        args = method;
        method = callee;
      } else {
        args = slice.call(arguments, 1);
      }

      $super = method.$super || method.superclass;
      return args.length
        ? $super.apply(this, args)
        : $super.call(this);
    }

    return { 'callSuper': callSuper };
  })();

  /*--------------------------------------------------------------------------*/

  Class.statics = (function() {
    function addMixins() {
      var arg, j, jmax,
       args = arguments, i = 0, imax = args.length,
       Klass = this, prototype = Klass.prototype;

      while (i < imax) {
        arg = args[i++];
        // auto execute arg if it's a closures
        if (typeof arg === 'function') arg = arg();
        // force to array, if not one, to support passing arrays
        if (!isArray(arg)) arg = [arg];

        j = 0; jmax = arg.length;
        while (j < jmax) {
          eachKey(arg[j++], function(method, key) {
            // flag as mixin if not used as a $super
            if (isFunction(method) && !method.$super)
              (prototype[key] = method)._isMixin = true;
          });
        }
      }
      return Klass;
    }

    function addPlugins() {
      var arg, j, jmax, k, plugins, otherMethod,
       args = arguments, i = 0, imax = args.length,
       Klass      = this,
       prototype  = Klass.prototype,
       superProto = Klass.superclass && Klass.superclass.prototype,
       subclasses = Klass.subclasses,
       subLength  = subclasses.length;

      while (i < imax) {
        arg = args[i++];
        if (typeof arg === 'function') arg = arg();
        if (!isArray(arg)) arg = [arg];

        j = 0; jmax = arg.length;
        while (j < jmax) {
          eachKey(arg[j++], function(method, key) {
            var protoMethod = prototype[key],
             superMethod = superProto && superProto[key];

            // avoid typeof === `function` because Safari 3.1+ mistakes
            // regexp instances as typeof `function`
            if (isFunction(method)) {
              // flag as $super if not used as a mixin
              if (isFunction(superMethod) && !superMethod._isMixin)
                method.$super = superMethod;

              if (isFunction(protoMethod)) {
                k = subLength;
                while (k--) {
                  otherMethod = subclasses[k].prototype[key];
                  if (otherMethod && otherMethod.$super)
                    otherMethod.$super = method;
                }
              }
            }
            prototype[key] = method;
          });
        }
      }
      return Klass;
    }

    function addStatics() {
      var arg, j, jmax, args = arguments,
       i = 0, imax = args.length, Klass = this;

      while (i < imax) {
        arg = args[i++];
        if (typeof arg === 'function') arg = arg();
        if (!isArray(arg)) arg = [arg];

        j = 0; jmax = arg.length;
        while (j < jmax) {
          eachKey(arg[j++], function(method, key) {
            if (isFunction(method)) Klass[key] = method;
          });
        }
      }
      return Klass;
    }

    function extend(plugins, mixins, statics) {
      var Klass = this;
      plugins && Klass.addPlugins(plugins);
      mixins  && Klass.addMixins(mixins);
      statics && Klass.addStatics(statics);
      return Klass;
    }

    return {
      'addMixins':  addMixins,
      'addPlugins': addPlugins,
      'addStatics': addStatics,
      'extend':     extend
    };
  })();

  /*--------------------------------------------------------------------------*/

  // replace placeholder objects with inheritable namespaces
  global.fuse = Class({ 'constructor': fuse });

  (function(__env) {
    delete fuse.env;
    var env        = fuse.addNS('env');
    env.addTest    = __env.addTest;
    env.removeTest = __env.removeTest;
    env.test       = __env.test;

    env.addNS('agent');
    _extend(env.agent, __env.agent);
  })(fuse.env);

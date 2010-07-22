  /*------------------------------ LANG: CLASS -------------------------------*/
  /* Based on work by Alex Arnell, John Resig, T.J. Crowder & Prototype core  */
  /* http://blog.niftysnippets.org/2009/09/simple-efficient-supercalls-in.html*/

  fuse.Class = (function() {
    var Subclass = function() { },

    clone = fuse.Object.clone,

    createNamedClass = function(name, LINKED_KEYS) {
      return Function('clone,LK',
        'function ' + name + '(){' +
        'var k,m,c=this;' +
        'if(m=c.initialize){' +
        'for(k in LK){c[k]=clone(c[k])}' +
        'return m.apply(c,arguments);' +
        '}} return ' + name)(clone, LINKED_KEYS);
    },

    Class = function Class(Superclass, plugins, mixins, statics) {
      var Klass, arg, mixins, plugin, i = 0,
       LINKED_KEYS     = { },
       args            = slice.call(arguments, 0),
       defaults        = Class.defaults,
       first           = args[0];
       isAutoUnlinking = true;

      // resolve superclass
      if (isString(first)) {
        Superclass = createNamedClass(args.shift());
      } else if (typeof first === 'function' && first.subclasses) {
        Superclass = args.shift();
      } else {
        Superclass = null;
      }

      plugins = args[0];
      mixins  = args[1];

      // auto execute plugins if they are closures and convert to array if not already
      if (typeof plugins === 'function') plugins = plugins();
      if (!isArray(plugins)) plugins = [plugins];

      // search properties for a custom `constructor` method
      while ((plugin = plugins[i++])) {
        if (hasKey(plugin, 'constructor')) {
          // power usage
          if (typeof plugin.constructor === 'function') {
            Klass = plugin.constructor;
            isAutoUnlinking = false;
          }
          // normal usage
          else if (isString(plugin.constructor)) {
            Klass = createNamedClass(plugin.constructor, LINKED_KEYS);
          }
          delete plugin.constructor;
        }
      }

      Klass = Klass || createNamedClass('UnnamedClass', LINKED_KEYS);

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
      Class.defaults.statics
        .addStatics.call(Klass, defaults.statics, args[2])
        .addPlugins(plugins)
        .addMixins(defaults.mixins, mixins);

      // flag keys of object/array references to be
      // automatically unlinked in the constructor
      if (isAutoUnlinking) {
        eachKey(Klass.plugin, function(value, key, object) {
          if (hasKey(object, key) && value && typeof value === 'object') {
            LINKED_KEYS[key] = 1;
          }
        });
      }

      plugin.constructor = Klass;
      return Klass;
    };

    return Class;
  })();

  fuse.Class.defaults = { };

  fuse.Class.mixins   = { };

  fuse.Class.statics  = { };

  /*--------------------------------------------------------------------------*/

  fuse.Class.defaults.mixins = (function() {
    var callSuper = function callSuper(method) {
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
    };

    return { 'callSuper': callSuper };
  })();

  /*--------------------------------------------------------------------------*/

  fuse.Class.defaults.statics = (function() {
    var addMixins = function addMixins() {
      var arg, j, jmax,
       args = arguments, i = -1, imax = args.length,
       Klass = this, prototype = Klass.prototype;

      while (++i < imax) {
        arg = args[i];
        // auto execute arg if it's a closures
        if (typeof arg === 'function') arg = arg();
        // force to array, if not one, to support passing arrays
        if (!isArray(arg)) arg = [arg];

        j = -1; jmax = arg.length;
        while (++j < jmax) {
          eachKey(arg[j], function(value, key, object) {
            if (hasKey(object, key)) {
              if (isFunction(value)) {
                // flag as mixin if not used as a $super
                if (!value.$super) {
                  value._isMixin = true;
                }
              } else if (value && typeof value === 'object') {
                value = fuse.Object.clone(value);
              }
              prototype[key] = value;
            }
          });
        }
      }
      return Klass;
    },

    addPlugins = function addPlugins() {
      var arg, j, jmax, k, plugins, otherMethod,
       args = arguments, i = -1, imax = args.length,
       Klass      = this,
       prototype  = Klass.prototype,
       superProto = Klass.superclass && Klass.superclass.prototype,
       subclasses = Klass.subclasses,
       subLength  = subclasses.length;

      while (++i < imax) {
        arg = args[i];
        if (typeof arg === 'function') arg = arg();
        if (!isArray(arg)) arg = [arg];

        j = -1; jmax = arg.length;
        while (++j < jmax) {
          eachKey(arg[j], function(value, key, object) {
            if (hasKey(object, key)) {
              var protoMethod = prototype[key],
               superMethod = superProto && superProto[key];
  
              // avoid typeof === `function` because Safari 3.1+ mistakes
              // regexp instances as typeof `function`
              if (isFunction(value)) {
                // flag as $super if not used as a mixin
                if (isFunction(superMethod) && !superMethod._isMixin) {
                  value.$super = superMethod;
                }
                if (isFunction(protoMethod)) {
                  k = subLength;
                  while (k--) {
                    otherMethod = subclasses[k].prototype[key];
                    if (otherMethod && otherMethod.$super)
                      otherMethod.$super = value;
                  }
                }
              } else if (value && typeof value === 'object') {
                value = fuse.Object.clone(value);
              }
              prototype[key] = value;
            }
          });
        }
      }
      return Klass;
    },

    addStatics = function addStatics() {
      var arg, j, jmax, args = arguments,
       i = -1, imax = args.length, Klass = this;

      while (++i < imax) {
        arg = args[i];
        if (typeof arg === 'function') arg = arg();
        if (!isArray(arg)) arg = [arg];

        j = -1; jmax = arg.length;
        while (++j < jmax) {
          eachKey(arg[j], function(value, key, object) {
            if (hasKey(object, key)) Klass[key] = value;
          });
        }
      }
      return Klass;
    },

    extend = function extend(plugins, mixins, statics) {
      var Klass = this;
      plugins && Klass.addPlugins(plugins);
      mixins  && Klass.addMixins(mixins);
      statics && Klass.addStatics(statics);
      return Klass;
    };

    return {
      'addMixins':  addMixins,
      'addPlugins': addPlugins,
      'addStatics': addStatics,
      'extend':     extend
    };
  })();

  /*--------------------------------------------------------------------------*/

  // replace placeholder objects with inheritable namespaces
  window.fuse = fuse.Class({ 'constructor': fuse });

  (function(__env) {
    delete fuse.env;
    var env        = fuse.addNS('env');
    env.addTest    = __env.addTest;
    env.removeTest = __env.removeTest;
    env.test       = __env.test;

    env.addNS('agent');
    fuse.Object.extend(env.agent, __env.agent);
  })(fuse.env);

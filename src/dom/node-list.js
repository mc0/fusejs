  /*----------------------------- DOM: NODELIST ------------------------------*/

  NodeList =
  fuse.dom.NodeList = fuse.Fusebox().Array;

  addNodeListMethod = (function(plugin) {

    var SKIPPED_KEYS = { 'callSuper': 1, 'constructor': 1, 'match': 1, 'query': 1 },
     domClassCache   = { },
     reBool          = /^(?:(?:is|has)[A-Z]|contains$)/,
     reGetter        = /^(?:(?:get|read)[A-Z]|(?:(?:down|first|identify|inspect|last|next|previous)$))/,
     reMod           = /^(?:update|replace|(?:append|prepend)(?:Child|Sibling)(?:To)?)$/,
     reScript        = /<script[\x20\t\n\r>]/i,
     arrEach         = ['for(;i<l;i++){if(e=es[i]){', '}}'],
     arrEvery        = ['for(;i<l;i++){if((e=es[i])&&!(', '))return false}return true'],
     arrSome         = ['for(;i<l;i++){if((e=es[i])&&(', '))return true}return false'];

    return function(value, key, object) {
      var snippet, arrMethod = reBool.test(key) ?
        (key.indexOf('is') ? arrSome : arrEvery) : arrEach;

      if (!SKIPPED_KEYS[key] && hasKey(object, key) && isFunction(value)) {
        if (reGetter.test(key)) {
          // getters return the value of the first element
          plugin[key] = Function('c,gc',
            'function ' + key + '(){' +
            'var m,n,e=this[0];' +
            'if(e){' +
            'm=(c[n=e.nodeName]||(c[n]=gc(n))).plugin.' + key + ';' +
            'return m&&(arguments.length?m.apply(e,arguments):m.call(e))' +
            '}}return ' + key)(domClassCache, getOrCreateTagClass);
        }
        else if (reMod.test(key)) {
          // when a html string is used with dom modification methods convert it
          // to an element/fragment once and clone it instead of converting it
          // for each iteration
          snippet = 'p=(c[n=e.nodeName]||(c[n]=gc(n))).plugin;m=p.' + key + ';m&&m.call(e,';

          plugin[key] = Function('c,gc,gf,re',
            'function ' + key + '(s,o){' +
            'var e,m,n,p,es=this,l=es.length,i=0,x={events:1,deep:1};' +
            'if((s||s=="0")&&!s.nodeType&&!re.test(s)){' +
            's=gf(s);' +
            arrMethod[0] + snippet + 's.cloneNode(true),o)' + arrMethod[1] +
            '}else{' +
            arrMethod[0] + snippet + 'p.clone.call(s,x),o)' + arrMethod[1] +
            '}return es' +
            '}return ' + key)(domClassCache, getOrCreateTagClass, getFragmentFromHTML, reScript);
        }
        else {
          // return true for methods prefixed with `is` when all return true OR
          // return true for methods prefixed with `has`/`contains` when some return true OR
          // return the array after executing a method for all elements
          snippet = '(m=(c[n=e.nodeName]||(c[n]=gc(n))).plugin.' + key + ')&&m.';

          plugin[key] = Function('c,gc',
            'function ' + key + '(){' +
            'var e,m,n,es=this,l=es.length,i=0;' +
            'if(arguments.length){' +
            arrMethod[0] + snippet + 'apply(e,arguments)' + arrMethod[1] +
            '}else{' +
            arrMethod[0] + snippet + 'call(e)' + arrMethod[1] +
            '}return es' +
            '}return ' + key)(domClassCache, getOrCreateTagClass);
        }
      }
    };
  })(NodeList.plugin);

  /*--------------------------------------------------------------------------*/

  (function(plugin) {
    var elemPlugin = fuse.dom.HTMLElement.plugin,
     funcPlugin    = fuse.Function.plugin,
     funcApply     = funcPlugin.apply,
     funcCall      = funcPlugin.call;

    plugin.get = function get(index) {
      var result, object = Object(this), length = object.length >>> 0;
      if (index == null) {
        result = NodeList();
        for (index = 0; index < length; index++) {
          if (index in object) result[index] = Node(object[index]);
        }
        return result;
      }

      if (index < 0) {
        if ((index += length) < 0) index = 0;
      } else if (index > (length && --length)) {
        index = length;
      }
      return Node(object[index]);
    };

    plugin.invoke = function invoke(method) {
      var args, item, i = 0, result = fuse.Array(),
       object = Object(this), length = object.length >>> 0;

      if (arguments.length < 2) {
        while (length--) {
          if (length in object) {
            result[length] = funcCall
              .call(elemPlugin[method] || object[length][method], object[length]);
          }
        }
      } else {
        args = slice.call(arguments, 1);
        while (length--) {
          if (length in object) {
            result[length] = funcApply
              .call(elemPlugin[method] || object[length][method], object[length], args);
          }
        }
      }
      return result;
    }

    // prevent JScript bug with named function expressions
    var get = null, invoke = null;
  })(NodeList.plugin);

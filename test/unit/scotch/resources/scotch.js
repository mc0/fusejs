/* Scotch JavaScript unit testing library, version 0.6.0
* (c) 2010 Kit Goncharov <http://kitgoncharov.github.com>
*
* Distributed under an MIT-style license.
* For details, see the Scotch web site: <http://kitgoncharov.github.com/scotch>.
*
* Built: Thu. Jun 10 2010 12:55:29 MDT
* ----------------------------------------------------------------------------*/

(function(global){
  function Scotch(name, options){
    return new Scotch.Suite(name, options);
  }
  Scotch.Version = "0.6.0";
  Scotch.Suites = [];
  Scotch.run = (function(Suites){
    function run(){
      var index = 0, length = Suites.length;
      for(; index < length; index++){
        Suites[index].run();
      }
      return Suites;
    }
    return run;
  }(Scotch.Suites));
  function isHostType(object, property){
    /* A helper method for safely detecting host object properties.
    Credits: John-David Dalton, FuseJS <http://fusejs.com> */
    var type = typeof object[property];
    return type === "object" ? !!object[property] : type !== "boolean" && type !== "number" && type !== "string" && type !== "undefined";
  }
  var getClass = Object.prototype.toString,
  nil = null,
  document = isHostType(global, "document") && global.document;
  Scotch.Tools = (function(){
    var pattern = /\\?#\{(.*?)\}/g, NW, match, acme, Ext, Sizzle, peppy, Slick, Sly, pirate;
    function inspect(object){
      /* `undefined`, `null`, Booleans, and Numbers */
      var className = getClass.call(object), property, length, result;
      if(typeof object === "undefined" || object === nil || className === "[object Boolean]" || className === "[object Number]"){
        result = object + "";
      }else if(className === "[object String]"){
        /* Strings */
        result = ('"' + object.replace(/"/g, "'") + '"');
      }else if(className === "[object Function]"){
        /* Functions */
        result = "function" + ("displayName" in object || "name" in object ? (" " + (object.name || object.displayName || "anonymous") + "") : "") + "(){...}";
      }else{
        try{
          object = Object(object);
          if("nodeType" in object && "nodeName" in object){
            /* Nodes */
            result = "<" + (object.nodeName.toLowerCase() + (object.id ? ' id="' + object.id + '"' : '') + (object.className ? ' class="' + object.className + '"' : '')) + ">";
          }else if("name" in object && "message" in object){
            /* Errors */
            result = ("**" + object.name + ": " + object.message + "**");
          }else if("length" in object){
            /* Generic iterables */
            if(object.length === 0){
              result = "[]";
            }else{
              result = [];
              property = 0;
              length = object.length;
              for(; property < length; property++){
                result[result.length] = inspect(object[property]);
              }
              result = "[" + result.join(", ") + "]";
            }
          }else{
            /* Generic objects */
            result = [];
            for(property in object){
              result[result.length] = '"' + property + '": ' + inspect(object[property]);
            }
            result = "{" + result.join(", ") + "}";
          }
        }catch(exception){
          result = object + "";
        }
      }
      return result;
    }
    function interpolate(template, replacements){
      /* Credits: Aycan Gulez, midori <http://midorijs.com> */
      if(!replacements){
        return template;
      }
      var expressions = template.match(pattern), length = expressions.length, expression;
      while(length--){
        expression = expressions[length];
        template = template.replace(expression, expression.charAt(0) === "\\" ? expression.slice(1) : inspect(replacements[expression.replace(pattern, "$1")]));
      }
      return template;
    }
    /* Credits: John-David Dalton, FuseJS */
    if((NW = global.NW) && NW.Dom){
      /* NWMatcher <http://github.com/dperini/nwmatcher> */
      match = NW.Dom.match;
    }else if((acme = global.acme)){
      /* Acme <http://svn.dojotoolkit.org/src/dojo/trunk/_base/query.js> */
      match = function(element, selector){
        var node, index = -1, query = acme.query(selector);
        while((node = query[++index])){
          if(node === element){
            return true;
          }
        }
        return false;
      };
    }else if((Ext = global.Ext) && Ext.DomQuery){
      /* DomQuery <http://www.extjs.com/deploy/ext/docs/output/DomQuery.jss.html> */
      match = function(element, selector){
        var node, index = -1, query = Ext.DomQuery.select(selector);
        while((node = query[++index])){
          if(node === element){
            return true;
          }
        }
        return false;
      };
    }else if((Sizzle = global.Sizzle)){
      /* Sizzle <http://sizzlejs.com> */
      match = function(element, selector){
        return Sizzle.matches(selector, [element]).length === 1;
      };
    }else if((peppy = global.peppy)){
      /* Peppy <http://jamesdonaghue.com/static/peppy> */
      match = function(element, selector){
        var node, index = -1, query = peppy.query(selector);
        while((node = query[++index])){
          if(node === element){
            return true;
          }
        }
        return false;
      };
    }else if((Slick = global.Slick)){
      /* Slick <http://github.com/subtleGradient/slick> */
      match = function(element, selector){
        return Slick.match(element, selector);
      };
    }else if((Sly = global.Sly)){
      /* Sly <http://github.com/digitarald/sly> */
      match = function(element, selector){
        return Sly(selector).match(element);
      };
    }else{
      match = function(){
        throw new Error("Scotch.Tools.match: A custom `match` function was not specified and none of the following CSS selectors were detected: NWMatcher, Acme, DomQuery, Sizzle, Peppy, Slick, Sly.");
      };
    }
    /* Pirate (:{) mode...thanks to John-David Dalton and Thomas Fuchs for suggesting the name */
    pirate = (function(original){
      function pirate(){
        delete Scotch.Tools.pirate;
        if(typeof(original) === "undefined"){
          delete global.Scotch;
        }else{
          global.Scotch = original;
        }
        return Scotch;
      }
      return pirate;
    }(global.Scotch));
    return {
      "inspect": inspect,
      "interpolate": interpolate,
      "match": match,
      "pirate": pirate
    };
  }());
  Scotch.Loggers = {
    "Web": (function(){
      var Prototype;
      function Web(element){
        if(!document){
          throw new Error("Scotch.Logger.Web: The web logger is not supported by the current environment.");
        }
        this.element = element || Web.defaultElement;
      }
      function initialize(name){
        this.element = document.getElementById(this.element);
        if(!this.element){
          throw new Error("Scotch.Logger.Web#setup: The specified logger element was not found.");
        }
        this.element.innerHTML = ('<h1>' + name + '<\/h1><div class="logsummary">Running...<\/div><table class="logtable"><thead><tr><th>Test<\/th><th>Status<\/th><th>Messages<\/th><\/tr><\/thead><tbody class="loglines"><\/tbody><\/table><\/div>');
        this.tbody = this.element.getElementsByTagName("tbody")[0];
      }
      function startTest(testName){
        var tr = document.createElement("tr"), first = document.createElement("td");
        first.appendChild(document.createTextNode(testName));
        tr.appendChild(first);
        tr.appendChild(document.createElement("td"));
        tr.appendChild(document.createElement("td"));
        this.tbody.appendChild(tr);
      }
      function write(text){
        var rows = this.element.getElementsByTagName("tr");
        rows[rows.length - 1].getElementsByTagName("td")[2].innerHTML = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/^\s\s*/, '').replace(/\s\s*$/, '').replace(/\n/g, "<br>");
      }
      function finishTest(status, summary){
        var rows, lastLine;
        rows = this.element.getElementsByTagName("tr");
        lastLine = rows[rows.length - 1];
        lastLine.className = status;
        lastLine.getElementsByTagName("td")[1].innerHTML = status;
        this.write(summary);
      }
      function summarize(text){
        this.element.getElementsByTagName("div")[0].innerHTML = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/^\s\s*/, "").replace(/\s\s*$/, "").replace(/\n/g, "<br>");
      }
      Web.defaultElement = "testlog";
      Prototype = Web.prototype;
      Prototype.initialize = initialize;
      Prototype.startTest = startTest;
      Prototype.write = write;
      Prototype.finishTest = finishTest;
      Prototype.summarize = summarize;
      return Web;
    }()),
    "Console": (function(){
      /* Based on work by Nathan L. Smith <http://nlsmith.com> */
      var print, Prototype;
      if(isHostType(global, "console") && isHostType(global.console, "log")){
        /* WebKit/Safari, Firebug... */
        print = function(line){
          return (arguments.length < 2 ? global.console.log(line) : global.console.log.apply(global.console, arguments));
        };
      }else if(isHostType(global, "print") && getClass.call(global["arguments"]) === "[object Array]"){
        /* Rhino, SpiderMonkey, JSC, V8... */
        print = function(line){
          return (arguments.length < 2 ? global.print(line) : global.print.apply(print, arguments));
        };
      }else if(isHostType(global, "WScript") && isHostType(global.WScript, "echo")){
        /* Windows Script Host */
        print = function(line){
          return (arguments.length < 2 ? global.WScript.echo(line) : Function.prototype.apply.call(global.WScript.echo, global.WScript, arguments));
        };
      }else{
        print = function(){
          throw new Error("Scotch.Logger.Console: Logging output to a console is not supported by the current environment.");
        };
      }
      function Console(){
        this.entry = "";
        print("Starting tests...");
      }
      function initialize(suiteName){
        print("=== Suite: " + suiteName + " ===");
      }
      function startTest(testName){
        this.entry += ("\n" + testName);
      }
      function write(message){
        print(this.entry + "\n" + message.replace(/^\s\s*/, "").replace(/\s\s*$/, ""));
        this.entry = "";
      }
      function finishTest(status, summary){
        this.entry += (" [" + status.toUpperCase() + "]");
        this.write(summary);
      }
      function summarize(summary){
        print("\n=== " + summary + " ===\n");
      }
      Prototype = Console.prototype;
      Prototype.initialize = initialize;
      Prototype.startTest = startTest;
      Prototype.write = write;
      Prototype.finishTest = finishTest;
      Prototype.summarize = summarize;
      return Console;
    }())
  };
  Scotch.Logger = Scotch.Loggers[document ? "Web" : "Console"];
  /* Inspired by Tobie Langel's Evidence <http://github.com/tobie/Evidence> */
  Scotch.Assertions = (function(){
    var size, HOP, INTERNAL_PROTOTYPE, assertHasProperty, refuteHasProperty, isVisible,
    assertElementVisible, refuteElementVisible, assertElementMatches, refuteElementMatches;
    function assert(expression, message){
      if(expression){
        this.pass();
      }else{
        this.fail("`assert`: Expression: #{expression}, Message: #{message}.", {
          "expression": expression,
          "message": message || "expression == false"
        });
      }
      return this;
    }
    function refute(expression, message){
      if(expression){
        this.fail("`refute`: Expression: #{expression}, Message: #{message}.", {
          "expression": expression,
          "message": message || "expression == true"
        });
      }else{
        this.pass();
      }
      return this;
    }
    function assertEqual(expected, actual, message){
      if(expected == actual){
        this.pass();
      }else{
        this.fail("`assertEqual`: Expected: #{expected}, Actual: #{actual}, Message: #{message}.", {
          "expected": expected,
          "actual": actual,
          "message": message || "expected != actual"
        });
      }
      return this;
    }
    function refuteEqual(expected, actual, message){
      if(expected != actual){
        this.pass();
      }else{
        this.fail("`refuteEqual`: Expected: #{expected}, Actual: #{actual}, Message: #{message}.", {
          "expected": expected,
          "actual": actual,
          "message": message || "expected == actual"
        });
      }
      return this;
    }
    function assertIdentical(expected, actual, message){
      if(expected === actual){
        this.pass();
      }else{
        this.fail("`assertIdentical`: Expected: #{expected}, Actual: #{actual}, Message: #{message}.", {
          "expected": expected,
          "actual": actual,
          "message": message || "expected !== actual"
        });
      }
      return this;
    }
    function refuteIdentical(expected, actual, message){
      if(expected !== actual){
        this.pass();
      }else{
        this.fail("`refuteIdentical`: Expected: #{expected}, Actual: #{actual}, Message: #{message}.", {
          "expected": expected,
          "actual": actual,
          "message": message || "expected === actual"
        });
      }
      return this;
    }
    /* Based on work by Jeremy Ashkenas (Underscore, <http://documentcloud.github.com/underscore>)
    and Philippe Rathe (equiv, http://philrathe.com/articles/equiv>) */
    function hoozit(object){
      var className, type = typeof object;
      if(type === "object" && !object){
        return "null";
      }else if(type === "undefined"){
        return "undefined";
      }else{
        className = getClass.call(object);
        switch(className){
          case "[object String]":
            return "string";
          case "[object Boolean]":
            return "boolean";
          case "[object Number]":
            return isNaN(object) ? "nan" : "number";
          case "[object Array]":
            return "array";
          case "[object Date]":
            return "date";
          case "[object RegExp]":
            return "regexp";
          case "[object Function]":
            return "function";
          default:
            return "object";
        }
      }
    }
    if(getClass.call(Object.keys) === "[object Function]"){
      size = function(object){
        return Object.keys(object).length;
      };
    }else{
      size = function(object){
        var count = 0, property;
        for(property in object){
          count++;
        }
        return count;
      };
    }
    function equivalent(expected, actual){
      var type, index, length;
      if(expected === actual){
        return true;
      }
      type = hoozit(expected);
      if((!expected && actual) || (expected && !actual) || type !== hoozit(actual)){
        return false;
      }
      switch(type){
        case "null":
        case "function":
          return expected === actual;
        case "string":
        case "boolean":
        case "number":
          return expected.valueOf() === actual.valueOf();
        case "undefined":
          return typeof actual === "undefined";
        case "nan":
          return isNaN(actual);
        case "date":
          return hoozit(actual) === "date" && expected.getTime() === actual.getTime();
        case "regexp":
          return hoozit(actual) === "regexp" && expected.source === actual.source && expected.global === actual.global && expected.ignoreCase === actual.ignoreCase && expected.multiline === actual.multiline && ("sticky" in actual ? expected.sticky === actual.sticky : true);
        case "array":
          length = expected.length;
          if(length !== actual.length){
            return false;
          }
          for(index = 0; index < length; index++){
            if(!equivalent(expected[index], actual[index])){
              return false;
            }
          }
          return true;
        case "object":
          if(size(expected) !== size(actual)){
            return false;
          }
          for(index in expected){
            if(!(index in actual) || !equivalent(expected[index], actual[index])){
              return false;
            }
          }
          return true;
        default:
          return false;
      }
    }
    function assertEquivalent(expected, actual, message){
      if(equivalent(expected, actual)){
        this.pass();
      }else{
        this.fail("`assertEquivalent`: Expected: #{expected}, Actual: #{actual}, Message: #{message}.", {
          "expected": expected,
          "actual": actual,
          "message": message || "The two objects are not equivalent"
        });
      }
      return this;
    }
    function refuteEquivalent(expected, actual, message){
      if(equivalent(expected, actual)){
        this.fail("`refuteEquivalent`: Expected: #{expected}, Actual: #{actual}, Message: #{message}.", {
          "expected": expected,
          "actual": actual,
          "message": message || "The two objects are equivalent"
        });
      }else{
        this.pass();
      }
      return this;
    }
    function assertInstanceOf(object, constructorFunction, message){
      if(object instanceof constructorFunction){
        this.pass();
      }else{
        this.fail("`assertInstanceOf`: Object: #{object}, Constructor: #{constructor}, Message: #{message}.", {
          "object": object,
          "constructor": constructorFunction,
          "message": message || "!(object instanceof constructor)"
        });
      }
      return this;
    }
    function refuteInstanceOf(object, constructorFunction, message){
      if(object instanceof constructorFunction){
        this.fail("`refuteInstanceOf`: Object: #{object}, Constructor: #{constructor}, Message: #{message}.", {
          "object": object,
          "constructor": constructorFunction,
          "message": message || "object instanceof constructor"
        });
      }else{
        this.pass();
      }
      return this;
    }
    /* Based on work by John-David Dalton (FuseJS) */
    if(getClass.call((HOP = Object.prototype.hasOwnProperty)) === "[object Function]"){
      /* Native `Object#hasOwnProperty` implementation; see ES5 section 15.2.4.5 */
      assertHasProperty = function(object, property, message){
        if(HOP.call(object, property)){
          this.pass();
        }else{
          this.fail("`assertHasProperty`: Object: #{object}, Property: #{property}, Message: #{message}.", {
            "object": object,
            "property": property,
            "message": message || "The object doesn't contain this property, or it was inherited through the prototype chain."
          });
        }
        return this;
      };
      refuteHasProperty = function(object, property, message){
        if(HOP.call(object, property)){
          this.fail("`refuteHasProperty`: Object: #{object}, Property: #{property}, Message: #{message}.", {
            "object": object,
            "property": property,
            "message": message || "The object contains this property, and it was not inherited through the prototype chain."
          });
        }else{
          this.pass();
        }
        return this;
      };
    }else if((INTERNAL_PROTOTYPE = "__proto__") && (function(){
      /* Tests if an object's internal [[Prototype]] is exposed through `__proto__`
      and can be overwritten...currently, only Gecko and WebKit support this. */
      var object = {}, list = [], backup, isSupported;
      if(object[INTERNAL_PROTOTYPE] === Object.prototype && list[INTERNAL_PROTOTYPE] === Array.prototype){
        backup = list[INTERNAL_PROTOTYPE];
        list[INTERNAL_PROTOTYPE] = nil;
        isSupported = typeof(list.reverse) === "undefined";
        list[INTERNAL_PROTOTYPE] = backup;
        isSupported = isSupported && getClass.call(list.reverse) === "[object Function]";
      }
      object = list = backup = nil;
      return isSupported;
    }())){
      /* Implementations for Safari 2.0 - 2.0.3 */
      assertHasProperty = function(object, property, message){
        var backup = object[INTERNAL_PROTOTYPE], result;
        object[INTERNAL_PROTOTYPE] = nil;
        result = property in object;
        object[INTERNAL_PROTOTYPE] = backup;
        if(result){
          this.pass();
        }else{
          this.fail("`assertHasProperty`: Object: #{object}, Property: #{property}, Message: #{message}.", {
            "object": object,
            "property": property,
            "message": message || "The object doesn't contain this property, or it was inherited through the prototype chain."
          });
        }
        return this;
      };
      refuteHasProperty = function(object, property, message){
        var backup = object[INTERNAL_PROTOTYPE], result;
        object[INTERNAL_PROTOTYPE] = nil;
        result = property in object;
        object[INTERNAL_PROTOTYPE] = backup;
        if(result){
          this.fail("`refuteHasProperty`: Object: #{object}, Property: #{property}, Message: #{message}.", {
            "object": object,
            "property": property,
            "message": message || "The object contains this property, and it was not inherited through the prototype chain."
          });
        }else{
          this.pass();
        }
        return this;
      };
    }else{
      /* Less elegant solutions for browsers that don't support either `Object#hasOwnProperty` or
      `__proto__`. Note: if an object doesn't have a `constructor` property, this implementation
      assumes that it doesn't have a prototype chain. */
      assertHasProperty = function(object, property, message){
        if(object.constructor && object.constructor.prototype ? (object[property] !== object.constructor.prototype[property]) : true){
          this.pass();
        }else{
          this.fail("`assertHasProperty`: Object: #{object}, Property: #{property}, Message: #{message}.", {
            "object": object,
            "property": property,
            "message": message || "The object doesn't contain this property, or it was inherited through the prototype chain."
          });
        }
        return this;
      };
      refuteHasProperty = function(object, property, message){
        if(object.constructor && object.constructor.prototype ? (object[property] !== object.constructor.prototype[property]) : true){
          this.fail("`refuteHasProperty`: Object: #{object}, Property: #{property}, Message: #{message}.", {
            "object": object,
            "property": property,
            "message": message || "The object contains this property, and it was not inherited through the prototype chain."
          });
        }else{
          this.pass();
        }
        return this;
      };
    }
    function assertStringMatches(string, expression, message){
      if(RegExp(expression).test(string)){
        this.pass();
      }else{
        this.fail("`assertStringMatches`: Expression: #{expression}, String: #{string}, Message: #{message}.", {
          "string": string,
          "expression": expression,
          "message": message || "expression.test(string) === false"
        });
      }
      return this;
    }
    function refuteStringMatches(string, expression, message){
      if(RegExp(expression).test(string)){
        this.fail("`refuteStringMatches`: Expression: #{expression}, String: #{string}, Message: #{message}.", {
          "string": string,
          "expression": expression,
          "message": message || "expression.test(string) === true"
        });
      }else{
        this.pass();
      }
      return this;
    }
    function assertThrowsException(method, exceptionName, message){
      try{
        method.call(global);
        this.fail("`assertThrowsException`: Function: #{method}, Message: #{message}.", {
          "method": method,
          "message": message || "The function did not throw any exceptions"
        });
      }catch(exception){
        if(exceptionName === exception.name){
          this.pass();
        }else{
          throw exception;
        }
      }
      return this;
    }
    function assertThrowsNothing(method, message){
      try{
        method.call(global);
        this.pass();
      }catch(exception){
        this.fail("`assertThrowsNothing`: Function: #{method}, Exception: #{exception}, Message: #{message}.", {
          "method": method,
          "exception": exception,
          "message": message || "The function threw an exception"
        });
      }
      return this;
    }
    if(document){
      if(isHostType(document, "defaultView") && isHostType(document.defaultView, "getComputedStyle")){
        isVisible = function(element){
          var display;
          if(element.style){
            display = element.style.display;
            if(!display || display === "auto"){
              /* W3C-compliant browsers use `AbstractView#getComputedStyle`. This implementation
              also guards against Safari 2.x incorrectly returning `null` when querying an
              element's computed style. */
              display = ((element.ownerDocument || document).defaultView.getComputedStyle(element, nil) || {}).display;
            }
            if(display === "none"){
              return false;
            }
          }
          return (element.parentNode ? isVisible(element.parentNode) : true);
        };
      }else if(isHostType(document, "documentElement") && "currentStyle" in document.documentElement){
        isVisible = function(element){
          /* IE uses `Element#currentStyle`. */
          var style = (element.ownerDocument || document).currentStyle;
          if(style && style.display === "none"){
            return false;
          }
          return (element.parentNode ? isVisible(element.parentNode) : true);
        };
      }
      assertElementVisible = function(element, message){
        if(isVisible(element)){
          this.pass();
        }else{
          this.fail("`assertElementVisible`: Element: #{element}, Message: #{message}.", {
            "element": element,
            "message": message || "The element is hidden"
          });
        }
        return this;
      };
      refuteElementVisible = function(element, message){
        if(isVisible(element)){
          this.fail("`refuteElementVisible`: Element: #{element}, Message: #{message}.", {
            "element": element,
            "message": message || "The element is visible and doesn't have a hidden parent element"
          });
        }else{
          this.pass();
        }
        return this;
      };
      assertElementMatches = function(element, selector, message){
        if(Scotch.Tools.match(element, selector)){
          this.pass();
        }else{
          this.fail("`assertElementMatches`: Selector: #{selector}, Element: #{element}, Message: #{message}.", {
            "selector": selector,
            "element": element,
            "message": message || "The element did not match the given CSS selector"
          });
        }
        return this;
      };
      refuteElementMatches = function(element, selector, message){
        if(Scotch.Tools.match(element, selector)){
          this.fail("`refuteElementMatches`: Selector: #{selector}, Element: #{element}, Message: #{message}.", {
            "selector": selector,
            "element": element,
            "message": message || "The element matched the given CSS selector"
          });
        }else{
          this.pass();
        }
        return this;
      };
    }else{
      assertElementVisible = function(){
        this.log("`assertElementVisible`: Skipped, not supported by the current environment.");
        return this;
      };
      refuteElementVisible = function(){
        this.log("`refuteElementVisible`: Skipped, not supported by the current environment.");
        return this;
      };
      assertElementMatches = function(){
        this.log("`assertElementMatches`: Skipped, not supported by the current environment.");
        return this;
      };
      refuteElementMatches = function(){
        this.log("`refuteElementMatches`: Skipped, not supported by the current environment.");
        return this;
      };
    }
    return {
      "assert": assert,
      "refute": refute,
      "assertEqual": assertEqual,
      "refuteEqual": refuteEqual,
      "assertIdentical": assertIdentical,
      "refuteIdentical": refuteIdentical,
      "assertEquivalent": assertEquivalent,
      "refuteEquivalent": refuteEquivalent,
      "assertInstanceOf": assertInstanceOf,
      "refuteInstanceOf": refuteInstanceOf,
      "assertHasProperty": assertHasProperty,
      "refuteHasProperty": refuteHasProperty,
      "assertStringMatches": assertStringMatches,
      "refuteStringMatches": refuteStringMatches,
      "assertThrowsException": assertThrowsException,
      "assertThrowsNothing": assertThrowsNothing,
      "assertElementVisible": assertElementVisible,
      "refuteElementVisible": refuteElementVisible,
      "assertElementMatches": assertElementMatches,
      "refuteElementMatches": refuteElementMatches
    };
  }());
  Scotch.Case = (function(){
    var inspect = Scotch.Tools.inspect, interpolate = Scotch.Tools.interpolate, Prototype,
    pause, resume;
    function Case(name, test, methods){
      if(getClass.call(test) !== "[object Function]"){
        throw new Error("Scotch.Case: `" + inspect(test) + "` is not a valid testcase.");
      }
      for(var method in methods){
        this[method] = methods[method];
      }
      this.name = name;
      this.test = test;
      this.assertions = 0;
      this.failures = 0;
      this.errors = 0;
      this.paused = false;
      this.message = "";
    }
    function Mixin(){}
    Mixin.prototype = Scotch.Assertions;
    Prototype = Case.prototype = new Mixin();
    function run(){
      try{
        if(this.nextTests){
          this.nextTests(this);
        }else{
          this.parent.options.logger.startTest(this.name);
          if(getClass.call(this.setup) === "[object Function]"){
            this.setup(this);
          }
          this.test(this);
        }
      }catch(exception){
        this.error(exception);
      }finally{
        if(!this.nextTests){
          try{
            if(getClass.call(this.teardown) === "[object Function]"){
              this.teardown(this);
            }
          }catch(error){
            this.error(error);
          }
        }
        if(!this.paused){
          this.parent.options.logger.finishTest(this.getStatus(), this.summarize());
          this.parent.currentTest++;
          this.parent.next();
        }
      }
      return this;
    }
    if(isHostType(global, "setTimeout") && isHostType(global, "clearTimeout")){
      /* Based on work by Tobie Langel (Evidence, <http://github.com/tobie/Evidence>) */
      pause = function(){
        var testcase = this;
        if(!testcase.paused){
          testcase.paused = true;
          testcase.parent.options.logger.write("Testing paused; waiting for an asynchronous test...");
          testcase.timeout = global.setTimeout(function(){
            testcase.resume(function(){
              testcase.fail("Asynchronous test timed out; testing was not resumed after being paused.");
            });
          }, Case.defaultTimeout);
        }
        return testcase;
      };
      resume = function(assertions){
        if(this.paused){
          this.paused = false;
          global.clearTimeout(this.timeout);
          if(assertions){
            this.nextTests = assertions;
            this.run();
          }
        }
        return this;
      };
    }else{
      pause = function(){
        this.log("Pausing testing isn't supported by the current environment.");
        this.paused = false;
        return this;
      };
      resume = function(){
        this.log("Resuming testing isn't supported by the current environment.");
        this.paused = false;
        return this;
      };
    }
    function benchmark(operation, iterations, methodName){
      /* Credits: Thomas Fuchs <http://gist.github.com/227048> */
      var number = iterations, startTime = new Date(), endTime;
      while(iterations--){
        operation();
      }
      endTime = new Date();
      this.message += "Benchmark: ";
      this.message += interpolate("#{operation} finished #{iterations} iterations in #{time}ms.", {
        "operation": methodName || this.name,
        "iterations": number,
        "time": endTime.getTime() - startTime.getTime()
      });
      this.message += "\n";
      return this;
    }
    function log(message, replacements){
      this.message += "Info: ";
      this.message += replacements ? interpolate(message, replacements) : message;
      this.message += "\n";
      return this;
    }
    function pass(){
      this.assertions++;
      return this;
    }
    function fail(message, replacements){
      this.failures++;
      this.message += "Failure: ";
      this.message += replacements ? interpolate(message, replacements) : message;
      this.message += "\n";
      return this;
    }
    function error(exception){
      this.errors++;
      this.message += "Error: ";
      this.message += inspect(exception);
      this.message += "\n";
      return this;
    }
    function summarize(){
      return interpolate("#{assertions} assertions, #{failures} failures, #{errors} errors\n", this) + this.message;
    }
    function getStatus(){
      return (this.failures ? "failed" : this.errors ? "error" : "passed");
    }
    Case.defaultTimeout = 7000;
    Prototype.run = run;
    Prototype.pause = pause;
    Prototype.resume = resume;
    Prototype.benchmark = benchmark;
    Prototype.log = log;
    Prototype.pass = pass;
    Prototype.fail = fail;
    Prototype.error = error;
    Prototype.summarize = summarize;
    Prototype.getStatus = getStatus;
    return Case;
  }());
  Scotch.Context = (function(){
    var Prototype, push = Array.prototype.push;
    function Context(){
      this.methods = {};
      this.tests = {};
      this.contexts = {};
    }
    function addMethods(methods){
      for(var method in methods){
        this.methods[method] = methods[method];
      }
      return this;
    }
    function addTests(tests){
      for(var test in tests){
        this.tests[test] = tests[test];
      }
      return this;
    }
    function addContext(name){
      return (this.contexts[name] || (this.contexts[name] = new Context()));
    }
    function consolidate(prefix){
      var results = [], contexts, tests, name;
      if(!prefix){
        prefix = "";
      }
      for(name in (contexts = this.contexts)){
        /* John Resig's super-fast array concatenation technique
        See <http://ejohn.org/blog/javascript-array-remove> */
        push.apply(results, contexts[name].consolidate(prefix + name + "::"));
      }
      for(name in (tests = this.tests)){
        results[results.length] = new Scotch.Case(prefix + name, tests[name], this.methods);
      }
      return results.sort(function(first, second){
        return (first.name < second.name ? -1 : first.name > second.name ? 1 : 0);
      });
    }
    Prototype = Context.prototype;
    Prototype.addMethods = addMethods;
    Prototype.addTests = addTests;
    Prototype.addContext = addContext;
    Prototype.consolidate = consolidate;
    return Context;
  }());
  Scotch.Suite = (function(){
    function Suite(name, options){
      this.name = name;
      this.options = Object(options);
      Scotch.Context.call(this);
      Scotch.Suites[Scotch.Suites.length] = this;
    }
    function Subclass(){}
    Subclass.prototype = Scotch.Context.prototype;
    var Prototype = Suite.prototype = new Subclass(), interpolate = Scotch.Tools.interpolate;
    function next(){
      var testcase = this.testcases[this.currentTest];
      if(!testcase){
        return this.options.logger.summarize(this.summarize());
      }
      testcase.parent = this;
      testcase.run();
      return this;
    }
    function run(){
      this.testcases = this.consolidate();
      this.currentTest = 0;
      if(!this.options.logger){
        this.options.logger = new Scotch.Logger();
      }
      this.options.logger.initialize(this.name);
      return this.next();
    }
    function summarize(){
      var testcases = this.testcases,
      results = {
        "tests": testcases.length,
        "assertions": 0,
        "failures": 0,
        "errors": 0
      }, index = 0, length = testcases.length;
      for(; index < length; index++){
        results.assertions += testcases[index].assertions;
        results.failures += testcases[index].failures;
        results.errors += testcases[index].errors;
      }
      return interpolate("#{tests} tests, #{assertions} assertions, #{failures} failures, #{errors} errors", results);
    }
    Prototype.next = next;
    Prototype.run = run;
    Prototype.summarize = summarize;
    return Suite;
  }());
  (function(run){
    if(isHostType(global, "addEventListener")){
      global.addEventListener("load", run, false);
    }else if(isHostType(global, "attachEvent")){
      global.attachEvent("onload", run);
    }
  }(Scotch.run));
  global.Scotch = Scotch;
}(this));

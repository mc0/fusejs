  /*------------------------------ LANG: CONSOLE -----------------------------*/

  fuse.addNS('console');

  // set the debug flag based on the fuse.js debug query parameter
  fuse.debug = (function() {
    var script, i = -1,
     reDebug    = /(^|&)debug=(1|true)(&|$)/,
     reFilename = /(^|\/)fuse\.js\?/,
     scripts    = fuse._doc && fuse._doc.getElementsByTagName('script');

    if (scripts) {
      while (script = scripts[++i]) {
        if (reFilename.test(script.src) &&
            reDebug.test(script.src.split('?')[1])) {
          return true;
        }
      }
    }
    return false;
  })();

  (function(console) {

    var object,

    error = fuse.Function.FALSE,

    info = error,

    consoleWrite = function(type, message) {
      fuse._div.innerHTML = '<div id="fusejs-console"><pre>x</pre></div>';
      var consoleElement = fuse._body.appendChild(fuse._div.firstChild),
       textNode = consoleElement.firstChild.firstChild;
      textNode.data = '';

      return (consoleWrite = function(type, message) {
        // append text and scroll to bottom of console
        textNode.data += type + ': ' + message + '\r\n\r\n';
        consoleElement.scrollTop = consoleElement.scrollHeight;
      })(type, message);
    },

    hasGlobalConsole = (
      isHostType(window, 'console') &&
      isHostType(window.console, 'info') &&
      isHostType(window.console, 'error')),

    hasOperaConsole = (
      isHostType(window, 'opera') &&
      isHostType(window.opera, 'postError')),

    hasJaxerConsole = (
      isHostType(window, 'Jaxer') &&
      isHostType(window.Jaxer, 'Log') &&
      isHostType(window.Jaxer.Log, 'info') &&
      isHostType(window.Jaxer.Log, 'error'));

    if (hasOperaConsole) {
      object = window.opera;
      info   = function info(message) { object.postError('Info: ' + message); };
      error  = function error(message, exception) {
        object.postError(['Error: ' + message + '\n', exception]);
      };
    }
    else if (hasGlobalConsole || hasJaxerConsole) {
      object = hasGlobalConsole ? window.console : window.Jaxer.Log;
      info   = function info(message) { object.info(message); };
      error  = function error(message, exception) {
        object.error(message, exception);
      };
    }
    else if (fuse._doc) {
      info  = function info (message) { consoleWrite('Info', message); };
      error = function error(message, error) {
        var result = message ? [message] : [];
        if (error) result.push(
          '[Error:',
          'name: '    + error.name,
          'message: ' + (error.description || error.message),
          ']');

        consoleWrite('Error', result.join('\r\n'));
      };
    }

    console.error = error;
    console.info  = info;
  })(fuse.console);

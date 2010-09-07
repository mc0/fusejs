  /*------------------------------ LANG: CONSOLE -----------------------------*/

  fuse.addNS('console');

  (function(console) {

    var logger, object,

    error = fuse.Function.FALSE,

    info = error,

    log = error,

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
      isHostType(window.Jaxer.Log, 'error')),

    consoleWrite = function(type, message) {
      var doc = fuse._doc,
       consoleElement = doc.createElement('div'),
       textNode = doc.createTextNode('');

      consoleElement.id = 'fusejs-console';
      fuse._body.appendChild(consoleElement)
       .appendChild(doc.createElement('pre'))
       .appendChild(textNode);

      consoleWrite = function(type, message) {
        // append text and scroll to bottom of console
        var top = textNode.data ? consoleElement.scrollHeight : 0;
        textNode.data += type + ': ' + message + '\r\n';
        consoleElement.scrollTop = top;
      };
      return consoleWrite(type, message);
    };

    if (hasOperaConsole) {
      object = window.opera;

      info = function info(message) {
        object.postError('Info: ' + message);
      };

      log = function log(message) {
        object.postError('Log: ' + message);
      };

      error = function error(message, exception) {
        object.postError(['Error: ' + message + '\n', exception]);
      };
    }
    else if (hasGlobalConsole || hasJaxerConsole) {
      object = hasGlobalConsole ? window.console : window.Jaxer.Log;
      logger = isHostType(object, 'log') ? 'log' :
        isHostType(object, 'debug') ? 'debug' : 'info';

      info = function info(message) {
        object.info(message);
      };

      log = function log(message) {
        object[logger](message);
      };

      error = function error(message, exception) {
        object.error(message, exception);
      };
    }
    else if (fuse._doc) {
      info = function info(message) {
        consoleWrite('Info', message);
      };

      log = function log(message) {
        consoleWrite('Log', message);
      };

      error = function error(message, error) {
        var result = message ? [message] : [];
        if (error) {
          result.push(
            '[Error:',
            'name: '    + error.name,
            'message: ' + (error.description || error.message),
            ']');
        }
        consoleWrite('Error', result.join('\r\n'));
      };
    }

    console.error = error;
    console.info  = info;
    console.log   = log;
  })(fuse.console);

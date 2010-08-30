  /*---------------------------------- DOM -----------------------------------*/

  NodeList = fuse.Array;

  domData =
  fuse.addNS('dom.data');

  fuse._doc    = window.document;
  fuse._div    = fuse._doc.createElement('DiV');
  fuse._docEl  = fuse._doc.documentElement;
  fuse._headEl = fuse._doc.getElementsByTagName('head')[0] || fuse._docEl;
  fuse._info   = { };

  domData[0] = { };
  domData[1] = { 'nodes': { } };

  fuse._info.docEl =
  fuse._info.root  =
    { 'nodeName': 'HTML', 'property': 'documentElement' };

  fuse._info.body =
  fuse._info.scrollEl =
    { 'nodeName': 'BODY', 'property': 'body' };

  /*--------------------------------------------------------------------------*/

  DATA_ID_PROP =
    envTest('ELEMENT_UNIQUE_NUMBER') ? 'uniqueNumber' : '_fuseId';

  PARENT_NODE =
    isHostType(fuse._docEl, 'parentElement') ? 'parentElement' : 'parentNode';

  // Safari 2.0.x returns `Abstract View` instead of `window`
  PARENT_WINDOW =
    isHostType(fuse._doc, 'defaultView') && fuse._doc.defaultView === window ? 'defaultView' :
    isHostType(fuse._doc, 'parentWindow') ? 'parentWindow' : null;

  getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType == DOCUMENT_NODE ? element : fuse._doc);
  };

  getNodeName = fuse._doc.createElement('nav').nodeName == 'NAV'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  getScriptText = function(element) {
    element.childNodes.length > 1 && element.normalize();
    return (element.firstChild || { }).data || '';
  };

  getWindow = function getWindow(element) {
    // based on work by Diego Perini
    var frame, i = -1, doc = getDocument(element), frames = window.frames;
    if (fuse._doc != doc) {
      while (frame = frames[++i]) {
        if (frame.document == doc)
          return frame;
      }
    }
    return window;
  };

  returnOffset = function(left, top) {
    var result  = fuse.Array(fuse.Number(left || 0), fuse.Number(top || 0));
    result.left = result[0];
    result.top  = result[1];
    return result;
  };

  runScriptText = (function() {
    var counter = 0;

    return function(text, context) {
      var head, result, script, suid = uid + '_script' + counter++;
      if (text && text != '') {
        fuse[suid] = { 'text': String(text) };
        text = 'fuse.' + suid + '.returned=eval(';

        context || (context = fuse._doc);
        head || (head = fuse._headEl);
        if (fuse._doc != context) {
          context = getDocument(context.raw || context);
          head = context ==context.getElementsByTagName('head')[0] || context.documentElement;
          text = 'parent.' + text + 'parent.';
        }

        text += 'fuse.' + suid + '.text);';

        // keep consistent behavior of `arguments`
        // uses an unresolvable reference so it can be deleted without
        // errors in JScript
        text = 'if("arguments" in this){' + text +
               '}else{arguments=void 0;'  + text +
               'delete arguments}';

        script = context.createElement('script');
        setScriptText(script, text);
        head.insertBefore(script, head.firstChild);
        head.removeChild(script);

        result = fuse[suid].returned;
        delete fuse[suid];
      }
      return result;
    };
  })();

  setScriptText = function(element, text) {
    (element.firstChild || element.appendChild(element.ownerDocument.createTextNode('')))
      .data = text == null ? '' : text;
  };

  if (PARENT_WINDOW) {
    getWindow = function getWindow(element) {
      return getDocument(element)[PARENT_WINDOW];
    };
  }

  if (envTest('ELEMENT_SCRIPT_HAS_TEXT_PROPERTY')) {
    getScriptText = function(element) {
      return element.text;
    };
    setScriptText = function(element, text) {
      element.text = text || '';
    };
  }

  fuse.dom.getDocument   = getDocument;
  fuse.dom.getWindow     = getWindow;
  fuse.dom.getScriptText = getScriptText;
  fuse.dom.setScriptText = setScriptText;
  fuse.dom.runScriptText = runScriptText;

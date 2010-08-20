  /*---------------------------------- DOM -----------------------------------*/

  // define NodeList as an array by default
  NodeList = fuse.Array;

  domData = 
  fuse.addNS('dom.data');

  domData['1'] = { };
  domData['2'] = { 'nodes': { } };

  fuse._doc   = window.document;
  fuse._div   = fuse._doc.createElement('DiV');
  fuse._docEl = fuse._doc.documentElement;
  fuse._info  = { };

  fuse._info.docEl =
  fuse._info.root  =
    { 'nodeName': 'HTML', 'property': 'documentElement' };

  fuse._info.body =
  fuse._info.scrollEl =
    { 'nodeName': 'BODY', 'property': 'body' };

  DATA_ID_PROP = envTest('ELEMENT_UNIQUE_NUMBER') ? 'uniqueNumber' : '_fuseId';

  PARENT_NODE = isHostType(fuse._docEl, 'parentElement') ? 'parentElement' : 'parentNode';

  /*--------------------------------------------------------------------------*/

  getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType == DOCUMENT_NODE ? element : fuse._doc);
  };

  // test if the nodeName is case sensitive and if it coerces
  // potentially unknown element nodeNames to uppercase
  getNodeName = fuse._doc.createElement('nav').nodeName == 'NAV'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  // based on work by Diego Perini
  getWindow = function getWindow(element) {
    var frame, i = -1, doc = getDocument(element), frames = window.frames;
    if (fuse._doc !== doc) {
      while (frame = frames[++i]) {
        if (frame.document === doc)
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

  // Safari 2.0.x returns `Abstract View` instead of `window`
  if (isHostType(fuse._doc, 'defaultView') && fuse._doc.defaultView === window) {
    getWindow = function getWindow(element) {
      return getDocument(element).defaultView;
    };
  } else if (isHostType(fuse._doc, 'parentWindow')) {
    getWindow = function getWindow(element) {
      return getDocument(element).parentWindow;
    };
  }

  fuse.dom.getDocument = getDocument;
  fuse.dom.getWindow   = getWindow;

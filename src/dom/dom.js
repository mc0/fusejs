  /*---------------------------------- DOM -----------------------------------*/

  // define NodeList as an array by default
  NodeList = fuse.Array;

  domData = 
  fuse.addNS('dom.data');

  domData['1'] = { };
  domData['2'] = { 'nodes': { } };

  fuse._doc   = global.document;
  fuse._div   = fuse._doc.createElement('DiV');
  fuse._docEl = fuse._doc.documentElement;
  fuse._info  = { };

  fuse._info.docEl =
  fuse._info.root  =
    { 'nodeName': 'HTML', 'property': 'documentElement' };

  fuse._info.body =
  fuse._info.scrollEl =
    { 'nodeName': 'BODY', 'property': 'body' };

  /*--------------------------------------------------------------------------*/

  getDocument = function getDocument(element) {
    return element.ownerDocument || element.document ||
      (element.nodeType === DOCUMENT_NODE ? element : fuse._doc);
  };

  // HTML documents coerce nodeName to uppercase
  getNodeName = fuse._div.nodeName === 'DIV'
    ? function(element) { return element.nodeName; }
    : function(element) { return element.nodeName.toUpperCase(); };

  // based on work by Diego Perini
  getWindow = function getWindow(element) {
    var frame, i = -1, doc = getDocument(element), frames = global.frames;
    if (fuse._doc !== doc) {
      while (frame = frames[++i]) {
        if (frame.document === doc)
          return frame;
      }
    }
    return global;
  };

  returnOffset = function(left, top) {
    var result  = fuse.Array(fuse.Number(left || 0), fuse.Number(top || 0));
    result.left = result[0];
    result.top  = result[1];
    return result;
  };

  // Safari 2.0.x returns `Abstract View` instead of `global`
  if (isHostType(fuse._doc, 'defaultView') && fuse._doc.defaultView === global) {
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

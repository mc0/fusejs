  /*--------------------------- ENVIRONMENT OBJECT ---------------------------*/

  fuse.env = {
    'agent': {
      'Gecko':        userAgent.indexOf('Gecko') > -1 && userAgent.indexOf('KHTML') < 0,
      'Opera':        /Opera/.test(toString.call(window.opera)),
      'MobileSafari': userAgent.search(/AppleWebKit.*Mobile/) > -1,
      'WebKit':       userAgent.indexOf('AppleWebKit/') > -1
    }
  };

  fuse.env.agent.IE = !fuse.env.agent.Opera &&
    userAgent.indexOf('MSIE') > -1 && isHostType(window, 'attachEvent');

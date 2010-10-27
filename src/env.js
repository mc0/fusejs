  /*--------------------------- ENVIRONMENT OBJECT ---------------------------*/

  fuse.env = (function() {

    var p = fuse._,
     ua = window.navigator && navigator.userAgent || '',
     isOpera = /Opera/.test(p.toString.call(window.opera));

    return {
      agent: {
        Gecko:        ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') < 0,
        IE:           ua.indexOf('MSIE') > -1 && p.isHostType(window, 'attachEvent') && !isOpera,
        Opera:        isOpera,
        MobileSafari: ua.search(/AppleWebKit.*Mobile/) > -1,
        WebKit:       ua.indexOf('AppleWebKit/') > -1
      }
    };
  })();

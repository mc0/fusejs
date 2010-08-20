var documentIsLoaded = $(document).isLoaded();

// eventResults defined in fuse.erb

/*--------------------------------------------------------------------------*/

$(document).observe('dom:loaded', function(event) {
  var body = $(document.body);

  eventResults.contentLoaded = {
    'endOfDocument': eventResults.endOfDocument,
    'windowLoad':    eventResults.windowLoad,
    'cssLoadCheck':  $('css_load_check').getStyle('height') == '100px',
    'target':        event.getTarget(),
    'currentTarget': event.getCurrentTarget()
  };

  body.appendChild('<img id="img_load_test">');

  $('img_load_test').observe('load', function(e) {
    if (e.getTarget() !== this)
      eventResults.currentTarget.imageOnLoadBug = true;
  }).setAttribute('src', '../src/fixtures/logo.gif');

  body.appendChild('<img id="img_error_test">');

  $('img_error_test').observe('error', function(e) {
    if (e.getTarget() !== this)
      eventResults.currentTarget.imageOnErrorBug = true;
  }).setAttribute('src', 'http://www.fusejs.com/xyz.gif');
});

/*--------------------------------------------------------------------------*/

$(window).observe('load', function(event) {
  eventResults.windowLoad = {
    'endOfDocument': eventResults.endOfDocument,
    'contentLoaded': eventResults.contentLoaded,
    'currentTarget': event.getCurrentTarget(),
    'target':        event.getTarget()
  };
});
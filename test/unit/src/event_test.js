new Test.Unit.Runner({

  // test firing an event and observing it on the element it's fired from
  'testCustomEventFiring': function() {
    var span = $('span'), fired = false;

    var observer = fuse.Function.bind(function(event) {
      this.assertEqual(span, event.getTarget());
      this.assertEqual(1, event.memo.index);
      fired = true;
    }, this);

    span.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened', { 'index': 1 });
    this.assert(fired);

    fired = false;
    span.fire('test:somethingElseHappened');
    this.assert(!fired);

    span.stopObserving('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    this.assert(!fired);
  },

  // test firing an event and observing it on a containing element
  'testCustomEventBubbling': function() {
    var span = $('span'), outer = $('outer'), fired = false;
    var observer = fuse.Function.bind(function(event) {
      this.assertEqual(span, event.getTarget());
      fired = true;
    }, this);

    outer.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    this.assert(fired);

    fired = false;
    span.fire('test:somethingElseHappened');
    this.assert(!fired);

    outer.stopObserving('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    this.assert(!fired);
  },

  'testCustomEventCanceling': function() {
    function outerObserver(event) {
      fired = span == event.getTarget();
    }

    function innerObserver(event) {
      theEvent = event;
      stopped  = true;
      before.push(event.isStopped(), event.isBubbling(),   event.isCancelled());
      returned.push(event.stop(),    event.stopBubbling(), event.cancel());
      after.push(event.isStopped(),  event.isBubbling(),   event.isCancelled());
    }

    var theEvent,
     before   = [],
     returned = [],
     after    = [],
     fired    = false,
     stopped  = false,
     span     = $('span'),
     outer    = $('outer'),
     inner    = $('inner');

    inner.observe('test:somethingHappened', innerObserver);
    outer.observe('test:somethingHappened', outerObserver);
    span.fire('test:somethingHappened');

    this.assert(stopped);
    this.assert(!fired);

    this.assertEnumEqual([false, true, false], before,
      'Before the event is stopped isStopped()/isCancelled() should return false and isBubbling() should return true.');

    this.assertEnumEqual([theEvent, theEvent, theEvent], returned,
      'The event object should be returned by stop(), stopBubbling(), and cancel().');

    this.assertEnumEqual([true, false, true], after,
      'After the event is stopped isStopped()/isCancelled() should return true and isBubbling() should return false.');

    fired = stopped = false;
    inner.stopObserving('test:somethingHappened', innerObserver);
    span.fire('test:somethingHappened');

    this.assert(!stopped);
    this.assert(fired);

    outer.stopObserving('test:somethingHappened', outerObserver);
  },

  'testEventAddMethods': function() {
    fuse.dom.Event.addPlugins({
      'hashBrowns': function() {
        return 'hash browns';
      },
      'toString': function() {
        return '[Fuse Event]';
      }
    });

    var event = $('span').fire('test:somethingHappened');
    this.assertRespondsTo('hashBrowns', event);

    event = $('span').fire('test:somethingHappened');
    this.assertEqual('[Fuse Event]', event.toString(),
      'Failed to extend element with a toString method.');

    delete fuse.dom.Event.plugin.toString;
  },

  'testEventObjectIsExtended': function() {
    var span = $('span'), event, observedEvent,
     observer = function(e) { observedEvent = e };

    span.observe('test:somethingHappened', observer);
    event = span.fire('test:somethingHappened');

    this.assertRespondsTo('stop', event, 'Failed to extend event object.');
    span.stopObserving('test:somethingHappened', observer);

    event = span.fire('test:somethingHappenedButNoOneIsListening');
    this.assertRespondsTo('stop', event, 'Failed to extend event with no observers');
  },

  'testEventObserversAreBoundToTheObservedElement': function() {
    var target,
     span = $('span'),
     observer = function() { target = this };

    span.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    span.stopObserving('test:somethingHappened', observer);

    this.assertEqual(span, target);
    target = null;

    var outer = $('outer');
    outer.observe('test:somethingHappened', observer);
    span.fire('test:somethingHappened');
    outer.stopObserving('test:somethingHappened', observer);

    this.assertEqual(outer, target);
  },

  'testMultipleCustomEventObserversWithTheSameHandler': function() {
    var span = $('span'), count = 0, observer = function() { count++ };

    span.observe('test:somethingHappened', observer);
    span.observe('test:somethingElseHappened', observer);
    span.fire('test:somethingHappened');

    this.assertEqual(1, count);
    span.fire('test:somethingElseHappened');

    this.assertEqual(2, count);
    span.stopObserving('test:somethingHappened', observer);
    span.stopObserving('test:somethingElseHappened', observer);
  },

  'testStopObservingWithoutArguments': function() {
    var span = $('span'), count = 0, observer = function() { count++ };

    span.observe('test:somethingHappened', observer);
    span.observe('test:somethingElseHappened', observer);
    span.stopObserving();
    span.fire('test:somethingHappened');

    this.assertEqual(0, count);

    span.fire('test:somethingElseHappened');
    this.assertEqual(0, count);

    this.assertEqual($(window), $(window).stopObserving());

    // test element with no observers
    this.assertNothingRaised(function() { $(document.body).stopObserving() });
  },

  'testStopObservingWithNoneStringEventName': function() {
    this.assertNothingRaised(function() { $('outer').stopObserving(1); });
  },

  'testStopObservingWithoutHandlerArgument': function() {
    var span = $('span'), count = 0, observer = function() { count++ };

    span.observe('test:somethingHappened', observer);
    span.observe('test:somethingElseHappened', observer);
    span.stopObserving('test:somethingHappened');
    span.fire('test:somethingHappened');

    this.assertEqual(0, count);
    span.fire('test:somethingElseHappened');

    this.assertEqual(1, count);
    span.stopObserving('test:somethingElseHappened');
    span.fire('test:somethingElseHappened');

    this.assertEqual(1, count);

    // test element with no observers
    this.assertNothingRaised(
      function() { $(document.body).stopObserving('test:somethingHappened') });
  },

  'testStopObservingRemovesHandlerFromCache': function() {
    var data, events, fuseId,
     span = $('span'), observer = function() { };

    span.observe('test:somethingHappened', observer);

    fuseId = span.getFuseId();
    data   = fuse.dom.data[fuseId];
    events = data.events;

    this.assert(data);
    this.assert(fuse.Array.isArray(events['test:somethingHappened'].handlers));

    this.assertEqual(1, events['test:somethingHappened'].handlers.length);

    span.stopObserving('test:somethingHappened', observer);
    this.assert(!events['test:somethingHappened']);
  },

  'testObserveAndStopObservingAreChainable': function() {
    var span = $('span'), observer = function() { };

    this.assertEqual(span, span.observe('test:somethingHappened', observer));
    this.assertEqual(span, span.stopObserving('test:somethingHappened', observer));

    span.observe('test:somethingHappened', observer);
    this.assertEqual(span, span.stopObserving('test:somethingHappened'));

    span.observe('test:somethingHappened', observer);
    this.assertEqual(span, span.stopObserving());
    this.assertEqual(span, span.stopObserving()); // assert it again, after there are no observers

    span.observe('test:somethingHappened', observer);
    this.assertEqual(span, span.observe('test:somethingHappened', observer)); // try to reuse the same observer
    span.stopObserving();
  },

  'testObserveInsideHandlers': function() {
    var fired = false, observer = function(event) { fired = true };

    // first observer should execute and attach a new observer
    // the added observer should not be executed this time around.
    $(document).observe('test:somethingHappened', function() {
      $(document).observe('test:somethingHappened', observer);
    });

    // if there is a bug then this observer will be skipped
    $(document).observe('test:somethingHappened', fuse.Function.NOOP);

    $(document).fire('test:somethingHappened');
    this.assert(!fired, 'observer should NOT have fired');

    $(document).fire('test:somethingHappened');
    this.assert(fired, 'observer should have fired');
    $(document).stopObserving('test:somethingHappened');
  },

  'testStopObservingInsideHandlers': function() {
    var fired = false, observer = function(event) { fired = true };

    // first observer should execute and stopObserving should not
    // effect this round of execution.
    $(document).observe('test:somethingHappened', function() {
      $(document).stopObserving('test:somethingHappened', observer);
    }).observe('test:somethingHappened', observer);

    // Gecko and WebKit will fail this test at the moment (1.02.09)
    $(document).fire('test:somethingHappened');

    this.assert(fired, 'observer should NOT have been stopped');

    fired = false;
    $(document).fire('test:somethingHappened');
    $(document).stopObserving('test:somethingHappened');

    this.assert(!fired, 'observer should have been stopped');
  },

  'testDocumentIsLoaded': function() {
    this.assert(!documentIsLoaded);
    this.assert($(document).isLoaded());
  },

  'testCssLoadedBeforeDocumentContentLoadedFires': function() {
    this.assert(eventResults.contentLoaded.cssLoadCheck);
  },

  'testDocumentContentLoadedEventFiresBeforeWindowLoad': function() {
    this.assert(eventResults.contentLoaded, 'contentLoaded');
    this.assert(eventResults.contentLoaded.endOfDocument,
      'contentLoaded.endOfDocument');

    this.assert(eventResults.windowLoad, 'windowLoad');
    this.assert(eventResults.windowLoad.endOfDocument,
      'windowLoad.endOfDocument');
    this.assert(eventResults.windowLoad.contentLoaded,
      'windowLoad.contentLoaded');

    this.assert(!eventResults.contentLoaded.windowLoad,
      '!contentLoaded.windowLoad');
  },

  'testEventIsStopped': function() {
    var span = $('span'), event;

    span.observe('test:somethingHappened', function() { });
    event = span.fire('test:somethingHappened');

    this.assert(!event.isStopped(),
      'event.isStopped() should return false with an empty observer');

    span.stopObserving('test:somethingHappened');
    span.observe('test:somethingHappened', function(e) { e.stop() });
    event = span.fire('test:somethingHappened');

    this.assert(event.isStopped(),
      'event.isStopped() should return true for an observer that calls stop');

    span.stopObserving('test:somethingHappened');
  },

  'testEventGetTarget': function() {
    this.assertIdentical($(window), eventResults.windowLoad.target,
      'window `onload` event.getTarget() should be window.');

    this.assertIdentical($(document), eventResults.contentLoaded.target,
      'document `dom:loaded` event.getTarget() should be document.');

    // This bug would occur in Firefox on image onload/onerror event
    // because the event.target is wrong and should use event.currentTarget.
    this.assertEqual(false, !!eventResults.currentTarget.imageOnErrorBug,
      'fuse.dom.Event#getTarget() image onerror bug.');

    this.wait(1000, function() {
      this.assertEqual(false, !!eventResults.currentTarget.imageOnLoadBug,
        'fuse.dom.Event#getTarget() image onload bug.');
    });
  },

  'testEventCurrentTarget': function() {
    this.assertIdentical($(window), eventResults.windowLoad.currentTarget,
      'window `onload` event.getCurrentTarget() should be window.');

    this.assertIdentical($(document), eventResults.contentLoaded.currentTarget,
      'document `dom:loaded` event.getCurrentTarget() should be document.');
  },

  'testEventFindElement': function() {
    var event, span = $('span');
    event = span.fire('test:somethingHappened');

    this.assertElementMatches(event.findElement(),
      'span#span');

    this.assertElementMatches(event.findElement('span'),
      'span#span');

    this.assertElementMatches(event.findElement('p'),
      'p#inner');

    this.assertElementMatches(event.findElement('.does_not_exist, span'),
      'span#span');

    this.assertEqual(null, event.findElement('div.does_not_exist'));
  },

  'testFuseIdDuplication': function() {
    var element = $('container').down();
    element.observe('test:somethingHappened', fuse.Function.NOOP);

    var fuseId = element.getFuseId(),
     clone = $(element.raw.cloneNode(true));
     cloneId = clone.getFuseId();

    this.assertNotEqual(fuseId, cloneId);

    $('container').raw.innerHTML += $('container').raw.innerHTML;

    this.assertNotEqual(fuseId, $('container').down());
    this.assertNotEqual(fuseId, $('container').down(1));
  },

  'testDocumentAndWindowFuseId': function() {
    fuse.Array(document, window).each(function(object) {
      $(object).observe('test:somethingHappened', fuse.Function.NOOP);
      this.assertUndefined(object.getFuseId);

      $(object).stopObserving('test:somethingHappened');
    }, this);
  },

  'testObserverExecutionOrder': function() {
    var span = $('span'), result = '';
    fuse.Array('a', 'b', 'c', 'd').each(function(n) {
      span.observe('test:somethingHappened', function() { result += n })
    });

    span.fire('test:somethingHappened');
    span.stopObserving('test:somethingHappened');

    this.assertEqual('abcd', result);
  }
});
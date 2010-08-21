new Test.Unit.Runner({

  'setup': function() {
    fuse.debug = true;
  },

  'teardown': function() {
    fuse.debug = false;
  },

  'testConsoleError': function() {
    var message = 'testing error output';
    fuse.console.error(message, new SyntaxError);

    this.assert(
      confirm('Do you see the error message "' + message + '" in your environment\'s console ?'),
      'fuse.Console.error() failed to write to the console');
  },

  'testConsoleInfo': function() {
    var message = 'testing info output';
    fuse.console.info(message);

    this.assert(
      confirm('Do you see the info message "' + message + '" in your environment\'s console ?'),
      'fuse.Console.info() failed to write to the console');
  }
});

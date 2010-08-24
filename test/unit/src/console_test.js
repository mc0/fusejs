new Test.Unit.Runner({

  'testConsoleError': function() {
    var message = 'testing error output';
    fuse.console.error(message, new SyntaxError);

    this.assert(
      confirm('Do you see the error message/warning "' + message + '" in your environment\'s console ?'),
      'fuse.console.error() failed to write to the console');
  },

  'testConsoleInfo': function() {
    var message = 'testing info output';
    fuse.console.info(message);

    this.assert(
      confirm('Do you see the info message/warning "' + message + '" in your environment\'s console ?'),
      'fuse.console.info() failed to write to the console');
  },

  'testConsoleLog': function() {
    var message = 'testing log output';
    fuse.console.log(message);

    this.assert(
      confirm('Do you see the log message/warning "' + message + '" in your environment\'s console ?'),
      'fuse.console.log() failed to write to the console');
  }
});

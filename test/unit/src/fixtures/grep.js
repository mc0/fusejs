var EnumObject = fuse.Class({
  'initialize': function(interior) {
    this.interior = interior;
  },
  
  '_each': function(callback) {
    for (key in this.interior) {
      if (fuse.Object.hasKey(this.interior, key))
        callback(this.interior[key], key, this);
    }
  }
}, fuse.Class.mixins.enumerable);

var Selector = fuse.Class({
  'initialize': function(pattern) {
    this.pattern = pattern;
  },

  'test': function(element) {
    return fuse.dom.selector.match(element, this.pattern);
  }
});

/*--------------------------------------------------------------------------*/

var Fixtures = {
  'Emoticons': $w(';-) ;-( :-) :-P'),

  'Nicknames': new EnumObject($w('juanbond jdd dperini kangax')),
  
  'Object': { '0':0, '2':2, 'length':3 },

  'many': {
    'a': 'A',
    'b': 'B',
    'c': 'C',
    'd': 'D#'
  },

  'mixed_dont_enum': { 'a':'A', 'b':'B', 'toString':'bar', 'valueOf':'' }
};
function prime(value) {
  for (var i = 2; i < value; i++) {
    if (value % i === 0) return false;
  }
  return true;
}

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
}, fuse.Enumerable);

/*--------------------------------------------------------------------------*/

var Fixtures = {
  'Empty': new EnumObject([]),
  
  'People': new EnumObject([
    { 'name': 'Sam Stephenson',    'nickname': 'sam-' },
    { 'name': 'Marcel Molina Jr.', 'nickname': 'noradio' },
    { 'name': 'Scott Barron',      'nickname': 'htonl' },
    { 'name': 'Nicholas Seckar',   'nickname': 'Ulysses' }
  ]),
  
  'Nicknames': new EnumObject($w('sam- noradio htonl Ulysses')),

  'UndefinedValues': new EnumObject(['a', 'b', undef]),
  
  'NullValues': new EnumObject(['a', 'b', null]),
  
  'ZeroValues': new EnumObject(['a', 'b', 0]),
  
  'Basic': new EnumObject([1, 2, 3]),
  
  'Primes': new EnumObject([
     1,  2,  3,  5,  7,  11, 13, 17, 19, 23,
    29, 31, 37, 41, 43,  47, 53, 59, 61, 67,
    71, 73, 79, 83, 89,  97
  ]),
  
  'Z': []
};

(function(i) {
  while (++i < 101) Fixtures.Z.push(i);
})(0);

Fixtures.Z = new EnumObject(Fixtures.Z);
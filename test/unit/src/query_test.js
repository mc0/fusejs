new Test.Unit.Runner({

  'testHashToQueryString': function() {
    this.assertEqual('',                   $H({ }).toQueryString());
    this.assertEqual('a%23=A',             $H({'a#': 'A'}).toQueryString());
    this.assertEqual('a=A%23',             $H(Fixtures.one).toQueryString());
    this.assertEqual('a=A&b=B&c=C&d=D%23', $H(Fixtures.many).toQueryString());
    this.assertEqual('a=b&c',              $H(Fixtures.value_undefined).toQueryString());
    this.assertEqual('a=b&c',              $H(fuse.String.toQueryParams('a=b&c')).toQueryString());
    this.assertEqual('a=b&c=',             $H(Fixtures.value_null).toQueryString());
    this.assertEqual('a=b&c=0',            $H(Fixtures.value_zero).toQueryString());

    this.assertEqual('color=r&color=g&color=b',
      $H(Fixtures.multiple).toQueryString());

    this.assertEqual('color=r&color=&color=g&color&color=0',
      $H(Fixtures.multiple_nil).toQueryString());

    this.assertEqual('color=&color',
      $H(Fixtures.multiple_all_nil).toQueryString());

    this.assertEqual('', $H(Fixtures.multiple_empty).toQueryString());
    this.assertEqual('', $H({ 'foo':{ }, 'bar':{ } }).toQueryString());

    this.assertEqual('stuff%5B%5D=%24&stuff%5B%5D=a&stuff%5B%5D=%3B',
      $H(Fixtures.multiple_special).toQueryString());

    this.assertHashEqual(Fixtures.multiple_special,
      $H(Fixtures.multiple_special).toQueryString().toQueryParams());

    this.assertEqual('a=A&b=B&toString=bar&valueOf=',
      $H(Fixtures.mixed_dont_enum).toQueryString());

    this.assertEqual('0=a&1=b&2=c',
      $H(fuse.Array('a', 'b', 'c')).toQueryString(),
      'Enumerated over inherited properties');
  },

  'testObjectToQueryString': function() {
    this.assertEqual('a=A&b=B&c=C&d=D%23',
      fuse.Object.toQueryString({ 'a':'A', 'b':'B', 'c':'C', 'd':'D#' }),
      'Failed with simple object');

    this.assertEqual('a=A&b=B&toString=bar&valueOf=',
      fuse.Object.toQueryString(Fixtures.mixed_dont_enum),
      'Failed to enumerate over shadowed properties like `toString` and `valueOf`');

    this.assertEqual('0=a&1=b&2=c',
      fuse.Object.toQueryString(fuse.Array('a', 'b', 'c')),
      'Enumerated over inherited properties');
  },

  'testStringToQueryParams': function() {
    // only the query part
    var result = { 'a':undef, 'b':'c' };

    this.assertHashEqual({ },
      fuse.String('').toQueryParams(),
      'empty query');

    this.assertHashEqual({ },
      fuse.String('foo?').toQueryParams(),
      'empty query with URL');

    this.assertHashEqual(result,
      fuse.String('foo?a&b=c').toQueryParams(),
      'query with URL');

    this.assertHashEqual(result,
      fuse.String('foo?a&b=c#fragment').toQueryParams(),
      'query with URL and fragment');

    this.assertHashEqual(result,
      fuse.String('a;b=c').toQueryParams(';'),
      'custom delimiter');

    this.assertHashEqual({ 'a': undef },
      fuse.String('a').toQueryParams(),
      'key without value');

    this.assertHashEqual({ 'a': 'b' },
      fuse.String('a=b&=c').toQueryParams(),
      'empty key');

    this.assertHashEqual({ 'a': 'b', 'c': '' },
      fuse.String('a=b&c=').toQueryParams(),
      'empty value');

    this.assertHashEqual({ 'a': 'b', 'c': undef },
      fuse.Object.toQueryString(fuse.String('a=b&c').toQueryParams()).toQueryParams(),
      'cross-convert containing an undefined value');

    this.assertHashEqual({'a b':'c', 'd':'e f', 'g':'h' },
      fuse.String('a%20b=c&d=e%20f&g=h').toQueryParams(),
      'proper decoding');

    this.assertHashEqual({ 'a':'b=c=d' },
      fuse.String('a=b=c=d').toQueryParams(),
      'multiple equal signs');

    this.assertHashEqual({ 'a':'b', c:'d' },
      fuse.String('&a=b&&&c=d').toQueryParams(),
      'proper splitting');

    this.assertEnumEqual($w('r g b'),
      fuse.String('col=r&col=g&col=b').toQueryParams()['col'],
      'collection without square brackets');

    var msg = 'empty values inside collection';

    this.assertEnumEqual(['r', '', 'b'],
      fuse.String('c=r&c=&c=b').toQueryParams()['c'], msg);

    this.assertEnumEqual(['', 'blue'],
      fuse.String('c=&c=blue').toQueryParams()['c'],  msg);

    this.assertEnumEqual(['blue', ''],
      fuse.String('c=blue&c=').toQueryParams()['c'],  msg);

    this.assertHashEqual(Fixtures.mixed_dont_enum,
      fuse.String('a=A&b=B&toString=bar&valueOf=').toQueryParams(),
      'Should not iterate over inherited properties.');
  }
});
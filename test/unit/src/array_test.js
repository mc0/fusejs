new Test.Unit.Runner({

  'test$A': function() {
    this.assertEnumEqual([], $A(),    'No value.');

    var object = { }, regexp = /x/;
    this.assertEnumEqual([false],  $A(false),  '`iterable` is a boolean.');
    this.assertEnumEqual([regexp], $A(regexp), '`iterable` is a regexp.');
    this.assertEnumEqual([object], $A(object), '`iterable` is an empty object.');
    this.assertEnumEqual([2], $A(2), '`iterable` is a number.');

    this.assertEnumEqual(['a', 'b', 'c'], $A(['a', 'b', 'c']), 'Simple array.');
    this.assertEnumEqual(['a', 'b', 'c'], $A('abc'), 'String value.');

    this.assertEnumEqual(['x'],
      $A({ 'toArray': function() { return ['x'] } }),
      '`toArray` method.');

    this.assertEnumEqual([document.documentElement],
      $A(document.getElementsByTagName('html')),
      'Simple nodeList.');

    (function(){
      this.assertEnumEqual([1, 2, 3], $A(arguments), 'Arguments object.');
    }).call(this, 1, 2, 3);

    this.assertEnumEqual(['a', 'b', 'c'], $A(fuse.String('abc')),
     'fuse.String value.');

    this.assertEnumEqual([0, undef, 2], $A(Fixtures.Object),
      'Object with missing indexes.');
  },

  'test$w': function() {
    this.assertEnumEqual(['a', 'b', 'c', 'd'], $w('a b c d'));
    this.assertEnumEqual([], $w(' '));
    this.assertEnumEqual([], $w(''));
    this.assertEnumEqual([], $w(null));
    this.assertEnumEqual([], $w(undef));
    this.assertEnumEqual([], $w());
    this.assertEnumEqual([], $w(10));
    this.assertEnumEqual(['a'], $w('a'));
    this.assertEnumEqual(['a'], $w('a '));
    this.assertEnumEqual(['a'], $w(' a'));
    this.assertEnumEqual(['a', 'b', 'c', 'd'], $w(' a   b\nc\t\nd\n'));
  },

  'testToArrayOnNodeList': function() {
    // direct HTML
    this.assertEqual(3, $A($('test_node').raw.childNodes).length);

    // DOM
    var element = document.createElement('div');
    element.appendChild(document.createTextNode('22'));
    fuse.Number(2).times(function() {
      element.appendChild(document.createElement('span')) });

    this.assertEqual(3, $A(element.childNodes).length);

    // HTML String
    element = document.createElement('div');
    $(element).update('22<span></span><span></span');
    this.assertEqual(3, $A(element.childNodes).length);
  },

  'testClear': function() {
    this.assertEnumEqual([], fuse.Array().clear(),
      'Clear empty list.');

    this.assertEnumEqual([], fuse.Array.from(1).clear(),
      'Clear list with one undefined value.');

    this.assertEnumEqual([], fuse.Array(1, 2).clear(),
      'Clear basic list with values.');

    this.assertEnumEqual([],
      fuse.Array.plugin.clear.call(fuse.Object.clone(Fixtures.Object)),
      'Called with an object as the `this` value.');
  },

  'testClone': function() {
    this.assertEnumEqual([], fuse.Array().clone());
    this.assertEnumEqual([1], fuse.Array.from(1).clone());
    this.assertEnumEqual([1, 2], fuse.Array(1, 2).clone());
    this.assertEnumEqual([0, 1, 2], fuse.Array(0, 1, 2).clone());

    var a = fuse.Array(0, 1, 2), b = a;
    this.assertIdentical(a, b);

    b = a.clone();
    this.assertNotIdentical(a, b);

    this.assertEnumEqual([0, undef, 2], fuse.Array.plugin.clone.call(Fixtures.Object),
      'Called with an object as the `this` value.');
  },

  'testCompact': function() {
    this.assertEnumEqual([],           fuse.Array().compact());
    this.assertEnumEqual([1, 2, 3],    fuse.Array(1, 2, 3).compact());
    this.assertEnumEqual([0, 1, 2, 3], fuse.Array(0, null, 1, 2, undef, 3).compact());
    this.assertEnumEqual([1, 2, 3],    fuse.Array(0, null, 1, '', 2, undef, 3).compact(true));
    this.assertEnumEqual([1, 2, 3],    fuse.Array(null, 1, 2, 3, null).compact());

    this.assertEnumEqual([0, 2],
      fuse.Array.plugin.compact.call(Fixtures.Object),
      'Called with an object as the `this` value.');

    this.assertEnumEqual([2],
      fuse.Array.plugin.compact.call(Fixtures.Object, true),
      'Called with an object as the `this` value and the `falsy` argument.');
  },

  'testContains': function() {
    var basic = fuse.Array(1, 2, 3),
     names = fuse.Array('joe', 'john', 'kit');

    this.assert(names.contains('joe'));
    this.assert(!names.contains('dagny'));

    this.assert(basic.contains(2));
    this.assert(!basic.contains('2'));
    this.assert(!basic.contains('4'));

    this.assert(basic.contains(fuse.Number(2)),
      'Should match Number object instances.');

    this.assert(names.contains(fuse.String('kit')),
      'Should match String object instances.');

    this.assert(
      fuse.Array.plugin.contains.call(Fixtures.Object, 2),
      'Called with an object as the `this` value.');
  },

 'testEach': function() {
    var self = this,
     source = fuse.Array(1, 2, 3, 4, 5),
     thisArg = { 'foo': 'bar' };

    source.each(function(item, index, array) {
      self.assertEqual(1, item);
      self.assertEqual(0, index);
      self.assertEqual(source, array);
      self.assertEqual(thisArg, this);
      return false;
    }, thisArg);

    var results = fuse.Array();
    fuse.Array.plugin.each.call(Fixtures.Object, function(value) {
      results.push(value)
    });

    this.assertEnumEqual([0, 2], results,
      'Called with an object as the `this` value.');

    this.assertRaise('TypeError',
      function() { Fixtures.Basic.each(); },
      'Should throw a TypeError if no callback is provided.');
  },

  'testEvery': function() {
    var IDENTITY = fuse.Function.IDENTITY;

    this.assert(fuse.Array(true, true, true).every(IDENTITY));
    this.assert(!fuse.Array(true, false, false).every(IDENTITY));
    this.assert(!fuse.Array(false, false, false).every(IDENTITY));

    this.assert(Fixtures.Basic.every(function(value) {
      return value > 0;
    }));

    this.assert(!Fixtures.Basic.every(function(value) {
      return value > 1;
    }));

    this.assert(fuse.Array.plugin.each.call(Fixtures.Object,
      function(value) { return value != null }),
      'Called with an object as the `this` value.');

    this.assertRaise('TypeError',
      function() { Fixtures.Basic.every(); },
      'Should throw a TypeError if no callback is provided.');
  },

  'testFilter': function() {
    var callback = function(value) { return value != null };

    this.assertEqual(Fixtures.Primes.join(', '),
      Fixtures.Z.filter(prime).join(', '));

    this.assertEnumEqual($w('a b'),
      fuse.Array('a', 'b', null).filter(callback));

    this.assertEnumEqual($w('a b'),
      fuse.Array('a', 'b', undef).filter(callback));

    this.assertEnumEqual(['a', 'b', 0],
      fuse.Array('a', 'b', 0).filter(callback));

    this.assertEnumEqual([0, 2], fuse.Array.plugin.filter.call(Fixtures.Object,
      callback),
      'Called with an object as the `this` value.');

    this.assertEnumEqual([], fuse.Array.plugin.filter.call(Fixtures.Object,
      function(value) { return value == null }),
      'Called with an object as the `this` value iterated over an undefined index.');

    this.assertRaise('TypeError',
      function() { Fixtures.Basic.filter(); },
      'Should throw a TypeError if no callback is provided.');
  },

  'testFirst': function() {
    this.assertEnumEqual([],        fuse.Array().first(3));
    this.assertEnumEqual([1, 2],    Fixtures.Basic.first(2));
    this.assertEnumEqual([1],       Fixtures.Basic.first(-3));
    this.assertEnumEqual([1, 2, 3], Fixtures.Basic.first(1000));
    this.assertEnumEqual([],        Fixtures.Basic.first('r0x0r5'));

    this.assertEqual(1, Fixtures.Basic.first());

    this.assertEqual(2,
      Fixtures.Basic.first(function(item) { return item === 2 }));

    this.assertUndefined(fuse.Array().first());

    this.assertUndefined(
      fuse.Array().first(function(item) { return item === 2 }));

    this.assertUndefined(
      Fixtures.Basic.first(function(item) { return item === 4 }));

    this.assertEqual(0, fuse.Array.plugin.first.call(Fixtures.Object),
      'Called with an object as the `this` value.');

    this.assertEnumEqual([0, undef], fuse.Array.plugin.first.call(Fixtures.Object, 2),
      'Called with an object as the `this` value iterated over an undefined index.');
  },

  'testFlatten': function() {
    this.assertEnumEqual([],        fuse.Array().flatten());
    this.assertEnumEqual([1, 2, 3], fuse.Array(1, 2, 3).flatten());
    this.assertEnumEqual([1, 2, 3], fuse.Array(1, [[[2, 3]]]).flatten());
    this.assertEnumEqual([1, 2, 3], fuse.Array([1], [2], [3]).flatten());
    this.assertEnumEqual([1, 2, 3], fuse.Array([[[[[[1]]]]]], 2, 3).flatten());

    this.assertEnumEqual([0, undef, 2], fuse.Array.plugin.flatten.call(Fixtures.Object),
      'Called with an object as the `this` value.');
  },

  'testForEach': function() {
    var nicknames = [];
    Fixtures.People.forEach(function(person, index) {
      nicknames.push(person.nickname);
    });

    this.assertEqual(Fixtures.Nicknames.join(', '),
      nicknames.join(', '));

    var results = fuse.Array();
    fuse.Array.plugin.forEach.call(Fixtures.Object, function(value) {
      results.push(value);
    });

    this.assertEnumEqual([0, 2], results,
      'Called with an object as the `this` value.');

    this.assertRaise('TypeError',
      function() { Fixtures.Basic.forEach(); },
      'Should throw a TypeError if no callback is provided.');
  },

  'testIndexOf': function() {
    this.assertEqual(-1, fuse.Array().indexOf(1));
    this.assertEqual(-1, fuse.Array.from(0).indexOf(1));
    this.assertEqual(0,  fuse.Array.from(1).indexOf(1));
    this.assertEqual(1,  fuse.Array(0, 1, 2).indexOf(1));
    this.assertEqual(0,  fuse.Array(1, 2, 1).indexOf(1));
    this.assertEqual(2,  fuse.Array(1, 2, 1).indexOf(1, -1));
    this.assertEqual(1,  fuse.Array(undef, null).indexOf(null));

    this.assertEqual(2,  fuse.Array.plugin.indexOf.call(Fixtures.Object, 2),
      'Called with an object as the `this` value.');

    this.assertEqual(-1, fuse.Array.plugin.indexOf.call(Fixtures.Object, undef),
      'Iterated over an undefined index.');
  },

  'testInject': function() {
    this.assertEqual(1061,
      Fixtures.Primes.inject(0, function(sum, value) {
        return sum + value;
      }));

    // test thisArg
    var Foo = { 'base': 4 };
    this.assertEqual(18, Fixtures.Basic.inject(0, function(sum, value) {
      return this.base + sum + value;
    }, Foo));

    // test undefined/null accumulator
    this.assertEqual(undef, Fixtures.Basic.inject(undef, function(accumulator) {
      return accumulator;
    }));

    this.assertEqual(null, Fixtures.Basic.inject(null, function(accumulator) {
      return accumulator;
    }));

    this.assertEqual(2,  fuse.Array.plugin.inject.call(Fixtures.Object, 0,
      function(sum, value) { return sum + value }),
      'Called with an object as the `this` value.');
  },

  'testInsert': function() {
    this.assertEnumEqual([0, 1, 2, 4, 5],
      fuse.Array(1, 2, 4, 5).insert(0, 0));

    this.assertEnumEqual([1, 2, 3, 4, 5],
      fuse.Array(1, 2, 4, 5).insert(2, 3));

    this.assertEnumEqual([1, 2, 4, 5, 6, 7, 8],
      fuse.Array(1, 2, 4, 5).insert(-1, 6, 7, 8));

    this.assertEnumEqual([1, 2, 4, 5, undef, undef, 8],
      fuse.Array(1, 2, 4, 5).insert(6, 8));

    this.assertEqual(2, fuse.Array.plugin.inject.call(Fixtures.Object, 0,
      function(sum, value) { return sum + value }),
      'Called with an object as the `this` value.');
  },

  'testIntersect': function() {
    this.assertEnumEqual([1, 3], fuse.Array(1, '2', 3).intersect([1, 2, 3]),
      'Should have performed a strict match.');

    this.assertEnumEqual([1], fuse.Array(1, 1).intersect([1, 1]),
      'Should only return one match even if the value is at more than one index.');

    this.assertEnumEqual([0], fuse.Array(0, 2).intersect([1, 0]),
      'Should have matched the falsy number 0.');

    this.assertEnumEqual([], fuse.Array(1, 1, 3, 5).intersect([4]),
      'Should not have matched the number 4.');

    this.assertEnumEqual([1, 2, 3],
      $R(1, 10).toArray().intersect([1, 2, 3]),
      'Should match Number object instances.');

    this.assertEnumEqual(['B', 'C', 'D'],
      $R('A', 'Z').toArray().intersect($R('B', 'D').toArray()),
      'Should match String object instances.');

    this.assertEnumEqual([1, 2, 3],
      fuse.Array(1,2,3, fuse.Number(2)).intersect([1, 2, 3]),
      'Should return only one entry with a valueOf 2.');

    var object = fuse.Object.clone(Fixtures.Object);
    object['1'] = undef;

    this.assertEnumEqual([0, 2],
      fuse.Array.plugin.intersect.call(Fixtures.Object, object),
      'Failed when called with an object as the `this` value.');
  },

  'testInvoke': function() {
    var result = fuse.Array(
      fuse.Array(2, 1, 3),
      fuse.Array(6, 5, 4)
    ).invoke('sort');

    this.assertEqual(2, result.length);
    this.assertEqual('1, 2, 3', result[0].join(', '));
    this.assertEqual('4, 5, 6', result[1].join(', '));

    result = result.invoke('invoke', 'toString', 2);
    this.assertEqual('1, 10, 11', result[0].join(', '));
    this.assertEqual('100, 101, 110', result[1].join(', '));

    var object = { '0':fuse.Number(0), '2':fuse.Number(2), 'length':3 };
    this.assertEnumEqual([1, undef, 3],
      fuse.Array.plugin.invoke.call(object, 'succ'),
      'Called with an object as the `this` value.');
  },

  'testLast': function() {
    var array = fuse.Array();
    array[-1] = 'blah';

    this.assertUndefined(array.last());

    this.assertUndefined(fuse.Array().last());
    this.assertEnumEqual([], fuse.Array().last(3));

    this.assertUndefined(
      fuse.Array().last(function(item) { return item === 2 }));

    this.assertEqual(1, fuse.Array.from(1).last());
    this.assertEqual(2, fuse.Array(1, 2).last());

    this.assertEqual(3, Fixtures.Basic.last());
    this.assertEnumEqual([2, 3], Fixtures.Basic.last(2));

    this.assertEqual(2,
      Fixtures.Basic.last(function(item) { return item === 2 }));

    this.assertUndefined(
      Fixtures.Basic.last(function(item) { return item === 4 }));

    this.assertEnumEqual([3], Fixtures.Basic.last(-3));
    this.assertEnumEqual([1, 2, 3], Fixtures.Basic.last(1000));

    this.assertEnumEqual([], Fixtures.Basic.last('r0x0r5'));

    this.assertEqual(2, fuse.Array.plugin.last.call(Fixtures.Object),
      'Called with an object as the `this` value.');

    this.assertEnumEqual([undef, 2], fuse.Array.plugin.last.call(Fixtures.Object, 2),
      'Should include the undefined index.');
  },

  'testLastIndexOf': function() {
    this.assertEqual(-1, fuse.Array().lastIndexOf(1));
    this.assertEqual(-1, fuse.Array.from(0).lastIndexOf(1));
    this.assertEqual(0,  fuse.Array.from(1).lastIndexOf(1));
    this.assertEqual(2,  fuse.Array(0, 2, 4, 6).lastIndexOf(4));
    this.assertEqual(3,  fuse.Array(4, 4, 2, 4, 6).lastIndexOf(4));
    this.assertEqual(3,  fuse.Array(0, 2, 4, 6).lastIndexOf(6, 3));
    this.assertEqual(-1, fuse.Array(0, 2, 4, 6).lastIndexOf(6, 2));
    this.assertEqual(0,  fuse.Array(6, 2, 4, 6).lastIndexOf(6, 2));

    var fixture = fuse.Array(1, 2, 3, 4, 3);
    this.assertEqual(4, fixture.lastIndexOf(3));
    this.assertEnumEqual([1, 2, 3, 4, 3], fixture);

    //tests from http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf
    var array = fuse.Array(2, 5, 9, 2);
    this.assertEqual(3,  array.lastIndexOf(2));
    this.assertEqual(-1, array.lastIndexOf(7));
    this.assertEqual(3,  array.lastIndexOf(2, 3));
    this.assertEqual(0,  array.lastIndexOf(2, 2));
    this.assertEqual(0,  array.lastIndexOf(2, -2));
    this.assertEqual(3,  array.lastIndexOf(2, -1));

    this.assertEqual(0,  fuse.Array.plugin.lastIndexOf.call(Fixtures.Object, 0),
      'Called with an object as the `this` value.');

    this.assertEqual(-1, fuse.Array.plugin.indexOf.call(Fixtures.Object, undef),
      'Iterated over an undefined index.');
  },

  'testMap': function() {
    var count = 0;
    var result = fuse.Array.plugin.map.call(Fixtures.Object, function(value) {
      count++;
      return value;
    });

    this.assertEqual(Fixtures.Nicknames.join(', '),
      Fixtures.People.map(function(person) {
        return person.nickname;
      }).join(', '));

    this.assertEqual(26,
      Fixtures.Primes.map(fuse.Function.IDENTITY).length);

    this.assertEqual(2, count,
      'Iterated over an undefined index.');

    this.assertEnumEqual([0, undef, 2], result,
      'Called with an object as the `this` value.');

    this.assertRaise('TypeError',
      function() { Fixtures.Basic.map(); },
      'Should throw a TypeError if no callback is provided.');
  },

  'testMax': function() {
    this.assertEqual(100, Fixtures.Z.max());
    this.assertEqual(97,  Fixtures.Primes.max());

    this.assertEqual(2,
      fuse.Array(-9, -8, -7, -6, -4, -3, -2,  0, -1,  2).max(),
      'Failed with negative and positive numbers.');

    this.assertEqual('kangax',
      Fixtures.Nicknames.max(),
      'Failed comparing string values.'); // ?s > ?U

    this.assertEqual(2, fuse.Array.plugin.max.call(Fixtures.Object),
      'Called with an object as the `this` value.');

    this.assertEqual('c',
      fuse.Array('a', 'b', 'c', 'd').max(
      function(value) { return value.charCodeAt(0) % 4 }),
      'Comparing string with callback.');
  },

  'testMin': function() {
    this.assertEqual(1, Fixtures.Z.min());
    this.assertEqual(0, fuse.Array(1, 2, 3, 4, 5, 6, 7, 8, 0, 9).min());

    this.assertEqual('dperini',
      Fixtures.Nicknames.min(),
      'Failed comparing string values.'); // ?U < ?h

    this.assertEqual(0, fuse.Array.plugin.min.call(Fixtures.Object),
      'Called with an object as the `this` value.');

    this.assertEqual('d',
      fuse.Array('a', 'b', 'c', 'd').min(
      function(value) { return value.charCodeAt(0) % 4 }),
      'Comparing string with callback.');
  },

  'testPartition': function() {
    var result = Fixtures.People.partition(function(person) {
      return person.name.length < 13;
    }).invoke('pluck', 'nickname');

    this.assertEqual(2, result.length);
    this.assertEqual('juanbond, dperini', result[0].join(', '));
    this.assertEqual('jdd, kangax', result[1].join(', '));

    result = fuse.Array.plugin.partition.call(Fixtures.Object, function(value) {
      return value != null;
    });

    this.assertEnumEqual([0, 2], result[0],
      'Called with an object as the `this` value.');

    this.assertEnumEqual([], result[1],
      'Iterated over an undefined index.');
  },

  'testPluck': function() {
    this.assertEqual(Fixtures.Nicknames.join(', '),
      Fixtures.People.pluck('nickname').join(', '));

    var object = {
      '0': { 'name': 'Joe' },
      '2': { 'name': 'John' },
      'length': 3
    };

    this.assertEnumEqual(['Joe', 'John', undef],
      fuse.Array.plugin.pluck.call(object, 'name').sort(),
      'Called with an object as the `this` value.');
  },

  'testSize': function() {
    this.assertEqual(4, fuse.Array(0, 1, 2, 3).size());
    this.assertEqual(0, fuse.Array().size());
    this.assertEqual(3, fuse.Array.plugin.size.call(Fixtures.Object),
      'Called with an object as the `this` value.');
  },

  'testSome': function() {
    var IDENTITY = fuse.Function.IDENTITY;

    this.assert(fuse.Array(true, true, true).some(IDENTITY));
    this.assert(fuse.Array(true, false, false).some(IDENTITY));
    this.assert(!fuse.Array(false, false, false).some(IDENTITY));

    this.assert(Fixtures.Basic.some(function(value) {
      return value > 2;
    }));

    this.assert(!Fixtures.Basic.some(function(value) {
      return value > 5;
    }));

    this.assert(fuse.Array.plugin.some.call(Fixtures.Object,
      function(value) { return value == 2 }),
      'Called with an object as the `this` value.');

    this.assert(!fuse.Array.plugin.some.call(Fixtures.Object,
      function(value) { return value == null }),
      'Iterated over an undefined index.');

    this.assertRaise('TypeError',
      function() { Fixtures.Basic.some(); },
      'Should throw a TypeError if no callback is provided.');
  },

  'testSortBy': function() {
    this.assertEqual('dperini, jdd, juanbond, kangax',
      Fixtures.People.sortBy(function(value) {
        return value.nickname.toLowerCase();
      }).pluck('nickname').join(', '));

    this.assertEnumEqual([1, 2, 3],
      fuse.Array(3, 1, 2).sortBy(),
      'No callback passed.');

    this.assertEnumEqual(fuse.Array(0, undef, 2).sortBy(fuse.Function.IDENTITY),
      fuse.Array.plugin.sortBy.call(Fixtures.Object, fuse.Function.IDENTITY),
      'Called with an object as the `this` value.');
  },

  'testUnique': function() {
    this.assertEnumEqual([1], fuse.Array(1, 1, 1).unique());
    this.assertEnumEqual([1], fuse.Array.from(1).unique());
    this.assertEnumEqual([],  fuse.Array().unique());

    this.assertEnumEqual([0, 1, 2, 3],
      fuse.Array(0, 1, 2, 2, 3, 0, 2).unique());

    var object = fuse.Object.clone(Fixtures.Object);
    object['4'] = 2;
    object.length = 5;

    this.assertEnumEqual([0, 2],
      fuse.Array.plugin.unique.call(object),
      'Called with an object as the `this` value.');
  },

  'testWithout': function() {
    this.assertEnumEqual([], fuse.Array().without(0));
    this.assertEnumEqual([], fuse.Array.from(0).without(0));
    this.assertEnumEqual([1], fuse.Array(0, 1).without(0));
    this.assertEnumEqual([1, 2], fuse.Array(0, 1, 2).without(0));
    this.assertEnumEqual(['test1', 'test3'], fuse.Array('test1', 'test2', 'test3').without('test2'));

    this.assertEnumEqual([2], fuse.Array.plugin.without.call(Fixtures.Object, 0),
      'Called with an object as the `this` value.');
  },

  'testZip': function() {
    var result = fuse.Array(1, 2, 3).zip([4, 5, 6], [7, 8, 9]);
    //this.assertEqual('[[1, 4, 7], [2, 5, 8], [3, 6, 9]]', result.inspect());

    result = fuse.Array(1, 2, 3).zip([4, 5, 6], [7, 8, 9],
      function(array) { return array.reverse() });

    //this.assertEqual('[[7, 4, 1], [8, 5, 2], [9, 6, 3]]', result.inspect());

    var object = fuse.Object.clone(Fixtures.Object);
    delete object['2'];
    object['0'] = 'a'; object['1'] = 'b';

    this.assertEqual("[[0, \'a\'], [undefined, \'b\'], [2, undefined]]",
       fuse.Array.plugin.zip.call(Fixtures.Object, object).inspect(),
      'Called with an object as the `this` value.');
  }
});
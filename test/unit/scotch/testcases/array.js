(function(){
  
  //Helper method used in `Methods::JS 1.6::Filter`
  function prime(value){
    for(var index = 2; index < value; index++){
      if(value % index === 0){
        return false;
      }
    }
    return true;
  }
  
  var FIXTURES = (function(){
    var index = 0,
    people = fuse.Array({
      "name": "Diego Perini",
      "nickname": "dperini"
    }, {
      "name": "John-David Dalton",
      "nickname": "jdd"
    }, {
      "name": "Joe Gornick",
      "nickname": "juanbond"
    }, {
      "name": "Juriy Zaytsev",
      "nickname": "kangax"
    }, {
      "name": "Kit Goncharov",
      "nickname": "kitgoncharov"
    }),
    nicknames = fuse.Array("dperini", "jdd", "juanbond", "kangax", "kitgoncharov"),
    basic = fuse.Array(1, 2, 3),
    //An array-like object
    iterable = {"0": 0, "2": 2, "length": 3},
    primes = fuse.Array(1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97),
    consecutive = fuse.Array();
    while(++index < 101){
      consecutive.push(index);
    }
    return {
      "people": people,
      "nicknames": nicknames,
      "basic": basic,
      "iterable": iterable,
      "primes": primes,
      "consecutive": consecutive
    };
  }());
  
  /* Main array test suite */
  var Suite = Scotch("fuse.Array Unit Tests");
  
  /* Test context for utility methods */
  var Utility = Suite.addContext("Utility");
  
  /* `$A` and `$w` */
  Utility.addMethods({
    "setup": function(){
      //Element fixture used in the DOM tests
      this.element = document.createElement("div");
    }
  }).addTests({
    "fuse.util.$A": function(testcase){
      
      //Simple arrays and Node Lists
      this.assertEquivalent(["a", "b", "c"], $A(["a", "b", "c"]), "`iterable` is a simple array");
      this.assertEquivalent([document.documentElement], $A(document.getElementsByTagName("html"), "`iterable` is a simple NodeList"));
      this.assertIdentical(3, $A(document.getElementById("test_node").childNodes).length);
      
      //Empty arguments
      this.assertEquivalent([], $A(), "No `iterable` argument");
      this.assertEquivalent([], $A({}), "`iterable` is an empty object");
      
      //Mixed arguments
      this.assertEquivalent(["a", "b", "c"], $A("abc"), "`iterable` is a string");
      this.assertEquivalent([0, undef, 2], $A(FIXTURES.iterable), "`iterable` is an array-like object with missing indices");
      this.assertEquivalent(["a", "b", "c"], $A(fuse.String("abc")), "`iterable instanceof fuse.String`");
      
      //An object with an explicit `toArray` method
      this.assertEquivalent(["x"], $A({
        "toArray": function(){
          return ["x"];
        }
      }), "`iterable` is an object with an explicit `toArray` method");
      
      //`arguments` object
      (function(){
        testcase.assertEquivalent([1, 2, 3], $A(arguments), "`iterable` is an `arguments` object");
      }(1, 2, 3));
    },
    "fuse.util.$A: DOM + Methods": function(){
      this.element.appendChild(document.createTextNode("22"));
      this.element.appendChild(document.createElement("span"));
      this.element.appendChild(document.createElement("span"));
      
      this.assertIdentical(3, $A(this.element.childNodes).length);
    },
    "fuse.util.$A: DOM + innerHTML": function(){
      this.element.innerHTML = "22<span></span><span></span";
      
      this.assertIdentical(3, $A(this.element.childNodes).length);
    },
    "fuse.util.$w": function(){
      this.assertEquivalent(["a", "b", "c", "d"], $w("a b c d"));
      
      this.assertEquivalent([], $w(" "));
      this.assertEquivalent([], $w(""));
      this.assertEquivalent([], $w(null));
      this.assertEquivalent([], $w(undef));
      this.assertEquivalent([], $w());
      
      this.assertEquivalent([], $w(10));
      this.assertEquivalent(["a"], $w("a"));
      
      //Should strip any leading/trailing whitespace
      this.assertEquivalent(["a"], $w("a "));
      this.assertEquivalent(["a"], $w(" a"));
      this.assertEquivalent(["a", "b", "c", "d"], $w(" a   b\nc\t\nd\n"));
    }
  });
  
  /* Test context for `fuse.Array.plugin` methods */
  var Methods = Suite.addContext("Methods");
  
  /* JavaScript 1.6 Array extensions */
  Methods.addContext("JS 1.6").addTests({
    "indexOf": function(){
      //`assertEqual` because `fuse.Array#indexOf` returns a `fuse.Number` instance
      this.assertEqual(-1, fuse.Array().indexOf(1));
      this.assertEqual(-1, fuse.Array.create(0).indexOf(1));
      
      this.assertEqual(0, fuse.Array.create(1).indexOf(1));
      this.assertEqual(0, fuse.Array(1, 2, 1).indexOf(1));
      
      this.assertEqual(1, fuse.Array(0, 1, 2).indexOf(1));
      this.assertEqual(2, fuse.Array(1, 2, 1).indexOf(1, -1));
      
      //Strict equality: `undefined !== null`
      this.assertEqual(1, fuse.Array(undef, nil).indexOf(nil));
      
      //Use `indexOf` as a generic
      this.assertEqual(2, fuse.Array.plugin.indexOf.call(FIXTURES.iterable, 2), "Called with an array-like object as the `this` value");
      this.assertEqual(-1, fuse.Array.plugin.indexOf.call(FIXTURES.iterable, undef), "Called with an array-like object as the `this` value; iterated over an undefined index");
    },
    "lastIndexOf": function(){
      this.assertEqual(-1, fuse.Array().lastIndexOf(1));
      this.assertEqual(-1, fuse.Array.create(0).lastIndexOf(1));
      this.assertEqual(-1, fuse.Array(0, 2, 4, 6).lastIndexOf(6, 2));
      
      this.assertEqual(0, fuse.Array.create(1).lastIndexOf(1));
      this.assertEqual(0, fuse.Array(6, 2, 4, 6).lastIndexOf(6, 2));
      
      this.assertEqual(2, fuse.Array(0, 2, 4, 6).lastIndexOf(4));
      this.assertEqual(3, fuse.Array(4, 4, 2, 4, 6).lastIndexOf(4));
      this.assertEqual(3, fuse.Array(0, 2, 4, 6).lastIndexOf(6, 3));
      
      //`3` occurs twice
      var fixture = fuse.Array(1, 2, 3, 4, 3);
      this.assertEqual(4, fixture.lastIndexOf(3));
      this.assertEquivalent([1, 2, 3, 4, 3], fixture);
      
      //Tests from <http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Objects:Array:lastIndexOf>
      var array = fuse.Array(2, 5, 9, 2);
      this.assertEqual(-1, array.lastIndexOf(7));
      this.assertEqual(0, array.lastIndexOf(2, 2));
      this.assertEqual(0, array.lastIndexOf(2, -2));
      this.assertEqual(3, array.lastIndexOf(2));
      this.assertEqual(3, array.lastIndexOf(2, 3));
      this.assertEqual(3, array.lastIndexOf(2, -1));
      
      //Use `lastIndexOf` as a generic
      this.assertEqual(0, fuse.Array.plugin.lastIndexOf.call(FIXTURES.iterable, 0), "Called with an array-like object as the `this` value");
      this.assertEqual(-1, fuse.Array.plugin.indexOf.call(FIXTURES.iterable, undef), "Called with an array-like object as the `this` value; iterated over an undefined index");
    },
    "every": function(){
      this.assert(fuse.Array().every());
      this.assert(fuse.Array(true, true, true).every());
      this.refute(fuse.Array(true, false, false).every());
      this.refute(fuse.Array(false, false, false).every());
      
      //Optional iterator function
      this.assert(FIXTURES.basic.every(function(value){
        return value > 0;
      }));
      this.refute(FIXTURES.basic.every(function(value){
        return value > 1;
      }));
      
      //Use `every` as a generic
      this.assert(fuse.Array.plugin.every.call(FIXTURES.iterable, function(value){
        return value != nil;
      }), "Called with an array-like object as the `this` value");
    },
    "filter": function(){
      this.assertEquivalent(FIXTURES.primes, FIXTURES.consecutive.filter(prime));
      this.assertEquivalent(["a", "b"], fuse.Array("a", "b", nil).filter());
      this.assertEquivalent(["a", "b"], fuse.Array("a", "b", undef).filter());
      this.assertEquivalent(["a", "b", 0], fuse.Array("a", "b", 0).filter());
      
      //Use `filter` as a generic
      this.assertEquivalent([0, 2], fuse.Array.plugin.filter.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
      this.assertEquivalent([], fuse.Array.plugin.filter.call(FIXTURES.iterable, function(value){
        return value == nil;
      }), "Called with an array-like object as the `this` value; iterated over an undefined index");
    },
    "forEach": function(){
      var nicknames = [];
      FIXTURES.people.forEach(function(person){
        nicknames.push(person.nickname);
      });
      this.assertEquivalent(nicknames, FIXTURES.nicknames);
      
      //Use `forEach` as a generic
      var results = fuse.Array();
      fuse.Array.plugin.forEach.call(FIXTURES.iterable, function(value){
        results.push(value);
      });
      this.assertEquivalent([0, 2], results, "Called with an array-like object as the `this` value");
    },
    "map": function(){
      this.assertEquivalent(FIXTURES.nicknames, FIXTURES.people.map(function(person){
        return person.nickname;
      }));
      
      //Calling `map` without an iterator function is equivalent to calling `clone`
      this.assertEquivalent(FIXTURES.primes.clone(), FIXTURES.primes.map());
      
      //Use `map` as a generic
      var count = 0, result = fuse.Array.plugin.map.call(FIXTURES.iterable, function(value){
        count++;
        return value;
      });
      this.assertIdentical(2, count, "Called with an array-like object as the `this` value; iterated over an undefined index");
      this.assertEquivalent([0, undef, 2], result, "Called with an array-like object as the `this` value");
    },
    "some": function(){
      this.refute(fuse.Array().some());
      this.assert(fuse.Array(true, true, true).some());
      this.assert(fuse.Array(true, false, false).some());
      this.refute(fuse.Array(false, false, false).some());
      
      //Optional iterator function
      this.assert(FIXTURES.basic.some(function(value){
        return value > 2;
      }));
      this.refute(FIXTURES.basic.some(function(value){
        return value > 5;
      }));
      
      //Use `some` as a generic
      this.assert(fuse.Array.plugin.some.call(FIXTURES.iterable, function(value){
        return value === 2;
      }), "Called with an array-like object as the `this` value");
      this.assert(!fuse.Array.plugin.some.call(FIXTURES.iterable, function(value){
        return value == nil;
      }), "Called with an array-like object as the `this` value; iterated over an undefined index");
    }
  });
  
  /* Optimized `fuse.Class.mixins.enumerable` methods */
  Methods.addContext("Enumerable").addTests({
    "contains": function(){
      var basic = fuse.Array(1, 2, 3), names = fuse.Array("joe", "john", "kit");
      this.assert(names.contains("joe"));
      this.refute(names.contains("dagny"));
      
      this.assert(basic.contains(2));
      this.refute(basic.contains("2"));
      this.refute(basic.contains("4"));
      
      this.assert(basic.contains(fuse.Number(2)), "Should match `fuse.Number` instances");
      this.assert(names.contains(fuse.String("kit")), "Should match `fuse.String` instances");
      
      //Using `contains` as a generic
      this.assert(fuse.Array.plugin.contains.call(FIXTURES.iterable, 2), "Called with an array-like object as the `this` value");
    },
    "each": function(testcase){
      var source = fuse.Array(1, 2, 3, 4, 5), thisArg = {"foo": "bar"};
      
      //`each` iterator arguments and context
      source.each(function(item, index, array){
        testcase.assertIdentical(1, item);
        testcase.assertIdentical(0, index);
        testcase.assertIdentical(source, array);
        testcase.assertIdentical(thisArg, this);
        return false;
      }, thisArg);
      
      //Using `each` as a generic
      var results = fuse.Array();
      fuse.Array.plugin.each.call(FIXTURES.iterable, function(value){
        results.push(value);
      });
      this.assertEquivalent([0, 2], results, "Called with an array-like object as the `this` value");
    },
    "first": function(){
      this.assertEquivalent([], fuse.Array().first(3));
      this.assertEquivalent([1, 2], FIXTURES.basic.first(2));
      this.assertEquivalent([1], FIXTURES.basic.first(-3));
      this.assertEquivalent([1, 2, 3], FIXTURES.basic.first(1000));
      this.assertEquivalent([], FIXTURES.basic.first("r0x0r5"));
      this.assertIdentical(1, FIXTURES.basic.first());
      this.assert(typeof fuse.Array().first() === "undefined");
      
      //Optional callback functions
      this.assertIdentical(2, FIXTURES.basic.first(function(item){
        return item === 2;
      }));
      this.assert(typeof fuse.Array().first(function(item){
        return item === 2;
      }) === "undefined");
      this.assert(typeof FIXTURES.basic.first(function(item){
        return item === 4;
      }) === "undefined");
      
      //Using `first` as a generic
      this.assertIdentical(0, fuse.Array.plugin.first.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
      this.assertEquivalent([0, undef], fuse.Array.plugin.first.call(FIXTURES.iterable, 2), "Called with an array-like object as the `this` value; iterated over an undefined index");
    },
    "inject": function(){
      this.assertIdentical(1061, FIXTURES.primes.inject(0, function(sum, value){
        return sum + value;
      }));
      
      //Optional `thisArg` argument
      var thisArg = {"base": 4};
      this.assertIdentical(18, FIXTURES.basic.inject(0, function(sum, value){
        return this.base + sum + value;
      }, thisArg));
      
      //`undefined` and `null` accumulators should be toxic
      this.assertIdentical(undef, FIXTURES.basic.inject(undef, function(accumulator){
        return accumulator;
      }));
      this.assertIdentical(nil, FIXTURES.basic.inject(nil, function(accumulator){
        return accumulator;
      }));
      
      //Using `inject` as a generic
      this.assertIdentical(2, fuse.Array.plugin.inject.call(FIXTURES.iterable, 0, function(sum, value){
        return sum + value;
      }), "Called with an array-like object as the `this` value");
    },
    "intersect": function(){
      //Strict matches
      this.assertEquivalent([1, 3], fuse.Array(1, "2", 3).intersect([1, 2, 3]), "Should have performed a strict match");
      this.assertEquivalent([0], fuse.Array(0, 2).intersect([1, 0]), "Should have matched the falsy number 0");
      
      //Single matches for multiple values
      this.assertEquivalent([1], fuse.Array(1, 1).intersect([1, 1]), "Should only return one match even if the value is at more than one index");
      this.assertEquivalent([1, 2, 3], fuse.Array(1, 2, 3, fuse.Number(2)).intersect([1, 2, 3]), "Should only return one entry with a `valueOf` 2");
      
      //Numbers and strings
      this.assertEquivalent([], fuse.Array(1, 1, 3, 5).intersect([4]), "Should not have matched the number 4");
      this.assertEquivalent([1, 2, 3], fuse.Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10).intersect([1, 2, 3]), "Should match numbers");
      this.assertEquivalent(["B", "C", "D"], fuse.Array("A", "B", "C", "D", "E", "F").intersect(fuse.Array("B", "C", "D")), "Should match strings");
      
      //Using `intersect` as a generic
      var object = {
        "0": 0,
        "2": 2,
        "length": 3
      };
      object["1"] = undef;
      this.assertEquivalent([0, 2], fuse.Array.plugin.intersect.call(FIXTURES.iterable, object), "Called with an array-like object as the `this` value");
    },
    "invoke": function(){
      var result = fuse.Array(fuse.Array(2, 1, 3), fuse.Array(6, 5, 4)).invoke("sort");
      this.assertEquivalent([[1, 2, 3], [4, 5, 6]], result);
      
      //Convert base 10 numbers into binary strings
      result = result.invoke("invoke", "toString", 2);
      this.assertEquivalent([["1", "10", "11"], ["100", "101", "110"]], result);
      
      //Using `invoke` as a generic
      var object = {
        "0": fuse.Number(0),
        "2": fuse.Number(2),
        "length": 3
      };
      this.assertEquivalent([1, undef, 3], fuse.Array.plugin.invoke.call(object, "succ"), "Called with an array-like object as the `this` value");
    },
    "last": function(){
      var array = fuse.Array();
      array[-1] = "blah";
      
      this.assert(typeof array.last() === "undefined");
      this.assert(typeof fuse.Array().last() === "undefined");
      this.assertEquivalent([], fuse.Array().last(3));
      
      this.assertIdentical(1, fuse.Array.create(1).last());
      this.assertIdentical(2, fuse.Array(1, 2).last());
      this.assertIdentical(3, FIXTURES.basic.last());
      this.assertEquivalent([2, 3], FIXTURES.basic.last(2));
      this.assertEquivalent([3], FIXTURES.basic.last(-3));
      this.assertEquivalent([1, 2, 3], FIXTURES.basic.last(1000));
      this.assertEquivalent([], FIXTURES.basic.last("r0x0r5"));
      
      //Optional matching function
      this.assert(typeof fuse.Array().last(function(item){
        return item === 2;
      } === "undefined"));
      this.assertIdentical(2, FIXTURES.basic.last(function(item){
        return item === 2;
      }));
      this.assert(typeof FIXTURES.basic.last(function(item){
        return item === 4;
      }) === "undefined");
      
      //Used as a generic
      this.assertEqual(2, fuse.Array.plugin.last.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
      this.assertEquivalent([undef, 2], fuse.Array.plugin.last.call(FIXTURES.iterable, 2), "Called with an array-like object as the `this` value; should include the undefined index");
    },
    "max": function(){
      this.assertIdentical(100, FIXTURES.consecutive.max());
      this.assertIdentical(97, FIXTURES.primes.max());
      this.assertIdentical(2, fuse.Array(-9, -8, -7, -6, -4, -3, -2, 0, -1, 2).max(), "Compared negative and positive numbers");
      this.assertIdentical("kitgoncharov", FIXTURES.nicknames.max(), "Compared string values");
      
      //Used as a generic
      this.assertIdentical(2, fuse.Array.plugin.max.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
      this.assertIdentical("c", fuse.Array("a", "b", "c", "d").max(function(value){
        return value.charCodeAt(0) % 4;
      }), "Compared each item with a callback");
    },
    "min": function(){
      this.assertIdentical(1, FIXTURES.consecutive.min());
      this.assertIdentical(0, fuse.Array(1, 2, 3, 4, 5, 6, 7, 8, 0, 9).min());
      this.assertIdentical("dperini", FIXTURES.nicknames.min(), "Compared string values");
      
      //Used as a generic
      this.assertIdentical(0, fuse.Array.plugin.min.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
      this.assertIdentical("d", fuse.Array("a", "b", "c", "d").min(function(value){
        return value.charCodeAt(0) % 4;
      }), "Compared each item with a callback");
    },
    "partition": function(){
      this.assertEquivalent([["dperini", "juanbond"], ["jdd", "kangax", "kitgoncharov"]], FIXTURES.people.partition(function(person){
        return person.name.length < 13;
      }).invoke("pluck", "nickname"));
      
      //Used as a generic
      this.assertEquivalent([[0, 2], []], fuse.Array.plugin.partition.call(FIXTURES.iterable, function(value){
        return value != nil;
      }), "Called with an array-like object as the `this` value; iterated over an undefined index");
    },
    "pluck": function(){
      this.assertEquivalent(FIXTURES.nicknames, FIXTURES.people.pluck("nickname"));
      
      //Used as a generic
      this.assertEquivalent(["Joe", "John", undef], fuse.Array.plugin.pluck.call({"0": {"name": "Joe"}, "2": {"name": "John"}, "length": 3}, "name").sort(), "Called with an array-like object as the `this` value");
    },
    "size": function(){
      this.assertEqual(4, fuse.Array(0, 1, 2, 3).size());
      this.assertEqual(0, fuse.Array().size());
      
      //Used as a generic
      this.assertEqual(3, fuse.Array.plugin.size.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
    },
    "sortBy": function(){
      this.assertEquivalent(["jdd", "juanbond", "dperini", "kangax", "kitgoncharov"], FIXTURES.people.sortBy(function(value){
        return value.nickname.charCodeAt(0) % 7;
      }).pluck("nickname"));
      
      this.assertEquivalent([1, 2, 3], fuse.Array(3, 1, 2).sortBy(), "No callback passed");
      
      //Used as a generic
      this.assertEquivalent(fuse.Array(0, undef, 2).sortBy(fuse.Function.IDENTITY), fuse.Array.plugin.sortBy.call(FIXTURES.iterable, fuse.Function.IDENTITY), "Called with an array-like object as the `this` value");
    },
    "zip": function(){
      this.assertEquivalent([[1, 4, 7], [2, 5, 8], [3, 6, 9]], fuse.Array(1, 2, 3).zip([4, 5, 6], [7, 8, 9]));
      this.assertEquivalent([[7, 4, 1], [8, 5, 2], [9, 6, 3]], fuse.Array(1, 2, 3).zip([4, 5, 6], [7, 8, 9], function(array){
        return array.reverse();
      }));
      
      //Used as a generic
      this.assertEquivalent([[0, "a"], [undef, "b"], [2, undef]], fuse.Array.plugin.zip.call(FIXTURES.iterable, {"0": "a", "1": "b", "length": 3}), "Called with an array-like object as the `this` value");
    }
  });
  
  Methods.addTests({
    "clear": function(){
      this.assertEquivalent([], fuse.Array().clear(), "Empty list");
      this.assertEquivalent([], fuse.Array.create(1).clear(), "List with one undefined value");
      this.assertEquivalent([], fuse.Array(1, 2).clear(), "List with basic values");
      
      //Used as a generic
      var object = fuse.Array.plugin.clear.call({"1": 1, "2": 2, "3": 3, "length": 4});
      
      //`object` should be a vanilla object with a `length` property of 0, not an array
      this.refuteEquivalent([], object, "Called with an array-like object as the `this` value; result should not be an array");
      this.assertEquivalent({"length": 0}, object, "Called with an array-like object as the `this` value; result should be an object");
    },
    "clone": function(){
      this.assertEquivalent([], fuse.Array().clone());
      this.assertEquivalent([1], fuse.Array.create(1).clone());
      this.assertEquivalent([1, 2], fuse.Array(1, 2).clone());
      this.assertEquivalent([0, 1, 2], fuse.Array(0, 1, 2).clone());
      
      this.assert(Object.prototype.toString.call(fuse.Array.plugin.clone.call([]).each) === "[object Function]", "Regular arrays should be converted to instances of `fuse.Array`");
      
      //References should be identical
      var a = fuse.Array(0, 1, 2), b = a;
      this.assertIdentical(a, b);
      
      //Clones should not be identical...
      b = a.clone();
      this.refuteIdentical(a, b);
      
      //...but they should be equivalent
      this.assertEquivalent(a, b);
      
      //Used as a generic
      this.assertEquivalent([0, undef, 2], fuse.Array.plugin.clone.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
    },
    "compact": function(){
      this.assertEquivalent([], fuse.Array().compact());
      this.assertEquivalent([1, 2, 3], fuse.Array(1, 2, 3).compact());
      this.assertEquivalent([0, 1, 2, 3], fuse.Array(0, null, 1, 2, undef, 3).compact());
      this.assertEquivalent([1, 2, 3], fuse.Array(0, null, 1, "", 2, undef, 3).compact(true), "Called with the `falsy` argument");
      this.assertEquivalent([1, 2, 3], fuse.Array(null, 1, 2, 3, null).compact());
      
      //Used as a generic
      this.assertEquivalent([0, 2], fuse.Array.plugin.compact.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
      this.assertEquivalent([2], fuse.Array.plugin.compact.call(FIXTURES.iterable, true), "Called with an array-like object as the `this` value and the `falsy` argument");
    },
    "flatten": function(){
      this.assertEquivalent([], fuse.Array().flatten());
      this.assertEquivalent([1, 2, 3], fuse.Array(1, 2, 3).flatten());
      this.assertEquivalent([1, 2, 3], fuse.Array(1, [[[2, 3]]]).flatten());
      this.assertEquivalent([1, 2, 3], fuse.Array([1], [2], [3]).flatten());
      this.assertEquivalent([1, 2, 3], fuse.Array([[[[[[1]]]]]], 2, 3).flatten());
      
      //Used as a generic
      this.assertEquivalent([0, undef, 2], fuse.Array.plugin.flatten.call(FIXTURES.iterable), "Called with an array-like object as the `this` value");
    },
    "insert": function(){
      this.assertEquivalent([0, 1, 2, 4, 5], fuse.Array(1, 2, 4, 5).insert(0, 0));
      this.assertEquivalent([1, 2, 3, 4, 5], fuse.Array(1, 2, 4, 5).insert(2, 3));
      this.assertEquivalent([1, 2, 4, 5, 6, 7, 8], fuse.Array(1, 2, 4, 5).insert(-1, 6, 7, 8));
      this.assertEquivalent([1, 2, 4, 5, undef, undef, 8], fuse.Array(1, 2, 4, 5).insert(6, 8));
      
      //Used as a generic
      var object = fuse.Array.plugin.insert.call({"0": 1, "1": 2, "2": 4, "3": 5, "length": 4}, 2, 3);
      
      //`object` should be a vanilla object with inserted indices, not an array
      this.refuteEquivalent([1, 2, 3, 4, 5], "Called with an array-like object as the `this` value; result should not be an array");
      this.assertEquivalent({"0": 1, "1": 2, "2": 3, "3": 4, "4": 5, "length": 5}, object, "Called with an array-like object as the `this` value; result should be an object");
    },
    "unique": function(){
      this.assertEquivalent([1], fuse.Array(1, 1, 1).unique());
      this.assertEquivalent([1], fuse.Array.create(1).unique());
      this.assertEquivalent([], fuse.Array().unique());
      this.assertEquivalent([0, 1, 2, 3], fuse.Array(0, 1, 2, 2, 3, 0, 2).unique());
      
      //Used as a generic
      this.assertEquivalent([0, 2], fuse.Array.plugin.unique.call({"0": 0, "2": 2, "4": 2, "length": 5}), "Called with an array-like object as the `this` value");
    },
    "without": function(){
      this.assertEquivalent([], fuse.Array().without(0));
      this.assertEquivalent([], fuse.Array.create(0).without(0));
      this.assertEquivalent([1], fuse.Array(0, 1).without(0));
      this.assertEquivalent([1, 2], fuse.Array(0, 1, 2).without(0));
      this.assertEquivalent(["test1", "test3"], fuse.Array("test1", "test2", "test3").without("test2"));
      
      //Used as a generic
      this.assertEquivalent([2], fuse.Array.plugin.without.call(FIXTURES.iterable, 0), "Called with an array-like object as the `this` value");
    }
  });
  
}());
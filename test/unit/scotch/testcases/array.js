(function(){
  
  var Fixtures = (function(){
    var index = 0, People = fuse.Array({
      "name": "Diego Perini",
      "nickname": "dperini"
    }, {
      "name": "Joe Gornick",
      "nickname": "juanbond"
    }, {
      "name": "John-David Dalton",
      "nickname": "jdd"
    }, {
      "name": "Juriy Zaytsev",
      "nickname": "kangax"
    }, {
      "name": "Ken Snyder",
      "nickname": "tr0gd0rr"
    }, {
      "name": "Kit Goncharov",
      "nickname": "kitgoncharov"
    }, {
      "name": "Mark Caudill",
      "nickname": "ninjainvisible"
    }, {
      "name": "Phred Lane",
      "nickname": "fearphage"
    }, {
      "name": "T.J. Crowder",
      "nickname": "tjcrowder"
    }),
    Nicknames = fuse.util.$w("tjcrowder fearphage ninjainvisible kitgoncharov tr0gd0rr kangax jdd juanbond dperini"),
    Basic = fuse.Array(1, 2, 3),
    Primes = fuse.Array(1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97),
    Z = fuse.Array();
    while(++index < 100){
      Z.push(index);
    }
    return {
      "People": People,
      "Nicknames": Nicknames,
      "Basic": Basic,
      "Primes": Primes,
      "Z": Z
    };
  }());
  
  var Suite = Scotch("fuse.Array Unit Tests");
  
  var Utility = Suite.addContext("Utility");
  
  Utility.addContext("fuse.util.$A").addMethods({
    "setup": function(){
      //Fixtures...
      this.iterable = {
        "0": 0,
        "2": 2,
        "length": 3
      };
      this.convertible = {
        "toArray": function(){
          return ["x"];
        }
      };
      this.element = document.createElement('div');
    }
  }).addTests({
    "Simple Lists": function(){
      this.assertEquivalent(['a', 'b', 'c'], $A(['a', 'b', 'c']), "`iterable` is a simple array");
      this.assertEquivalent([document.documentElement], $A(document.getElementsByTagName('html'), "`iterable` is a simple NodeList"));
      this.assertIdentical(3, $A(document.getElementById('test_node').childNodes).length);
    },
    "Empty Arguments": function(){
      this.assertEquivalent([], $A(), "No `iterable` argument");
      this.assertEquivalent([], $A({}), "`iterable` is an empty object");
    },
    "Mixed Arguments": function(testcase){
      this.assertEquivalent(['a', 'b', 'c'], $A('abc'), "`iterable` is a string");
      this.assertEquivalent([0, undef, 2], $A(this.iterable), "`iterable` is an array-like object with missing indices");
      this.assertEquivalent(['a', 'b', 'c'], $A(fuse.String('abc')), "`iterable instanceof fuse.String`");
      
      this.assertEquivalent(["x"], $A(this.convertible), "`iterable` is an object with an explicit `toArray` method");
      
      (function(){
        testcase.assertEquivalent([1, 2, 3], $A(arguments), "`iterable` is an `arguments` object");
      }(1, 2, 3));
    },
    "DOM Trees (DOM Methods)": function(){
      this.element.appendChild(document.createTextNode('22'));
      this.element.appendChild(document.createElement('span'));
      this.element.appendChild(document.createElement('span'));
      this.assertIdentical(3, $A(this.element.childNodes).length);
    },
    "DOM Trees (`innerHTML`)": function(){
      this.element.innerHTML = "22<span></span><span></span";
      this.assertIdentical(3, $A(this.element.childNodes).length);
    }
  });
  
  Utility.addTests({
    "fuse.util.$w": function(){
      this.assertEquivalent(['a', 'b', 'c', 'd'], $w('a b c d'));
      this.assertEquivalent([], $w(' '));
      this.assertEquivalent([], $w(''));
      this.assertEquivalent([], $w(null));
      this.assertEquivalent([], $w(undef));
      this.assertEquivalent([], $w());
      this.assertEquivalent([], $w(10));
      this.assertEquivalent(['a'], $w('a'));
      this.assertEquivalent(['a'], $w('a '));
      this.assertEquivalent(['a'], $w(' a'));
      this.assertEquivalent(['a', 'b', 'c', 'd'], $w(' a   b\nc\t\nd\n'));
    }
  });
  
  Suite.addContext("Methods").addMethods({
    "setup": function(){
      this.iterable = {
        "0": 0,
        "2": 2,
        "length": 3
      };
    },
    //Instance method
    "prime": function(value){
      for(var index = 2; index < value; index++){
        if(value % index === 0){
          return false;
        }
      }
    }
  }).addTests({
    "clear": function(){
      this.assertEquivalent([], fuse.Array().clear(), "Empty list");
      this.assertEquivalent([], fuse.Array.create(1).clear(), "List with one undefined value");
      this.assertEquivalent([], fuse.Array(1, 2).clear(), "List with basic values");
      
      var object = fuse.Array.plugin.clear.call(this.iterable), array = Array.prototype.slice.call(object);
      this.assert(object, "Called with an array-like object as the `this` value");
      this.refuteEquivalent([], object, "Cleared object should not be an array");
      this.assertEquivalent([], array, "Cleared object should be coercible to an empty array");
    },
    "clone": function(){
      this.assertEquivalent([], fuse.Array().clone());
      this.assertEquivalent([1], fuse.Array.create(1).clone());
      this.assertEquivalent([1, 2], fuse.Array(1, 2).clone());
      this.assertEquivalent([0, 1, 2], fuse.Array(0, 1, 2).clone());
      
      var a = fuse.Array(0, 1, 2), b = a;
      this.assertIdentical(a, b);
      
      b = a.clone();
      this.refuteIdentical(a, b);
      
      this.assert(Object.prototype.toString.call(fuse.Array.plugin.clone.call([]).each) === "[object Function]", "Regular arrays should be converted to instances of `fuse.Array`");
      
      this.assertEquivalent([0, undef, 2], fuse.Array.plugin.clone.call(this.iterable), "Called with an array-like object as the `this` value");
    },
    "compact": function(){
      this.assertEquivalent([], fuse.Array().compact());
      this.assertEquivalent([1, 2, 3], fuse.Array(1, 2, 3).compact());
      this.assertEquivalent([0, 1, 2, 3], fuse.Array(0, null, 1, 2, undef, 3).compact());
      this.assertEquivalent([1, 2, 3], fuse.Array(0, null, 1, '', 2, undef, 3).compact(true), "Called with the `falsy` argument");
      this.assertEquivalent([1, 2, 3], fuse.Array(null, 1, 2, 3, null).compact());
      
      this.assertEquivalent([0, 2], fuse.Array.plugin.compact.call(this.iterable), "Called with an array-like object as the `this` value");
      this.assertEquivalent([2], fuse.Array.plugin.compact.call(this.iterable, true), "Called with an array-like object as the `this` value and the `falsy` argument");
    },
    "contains": function(){
      var basic = fuse.Array(1, 2, 3), names = fuse.Array('joe', 'john', 'kit');
      
      this.assert(names.contains('joe'));
      this.refute(names.contains('dagny'));

      this.assert(basic.contains(2));
      this.refute(basic.contains('2'));
      this.refute(basic.contains('4'));
      
      this.assert(basic.contains(fuse.Number(2)), "Should match `fuse.Number` instances");
      this.assert(names.contains(fuse.String('kit')), "Should match `fuse.String` instances");
      
      this.assert(fuse.Array.plugin.contains.call(this.iterable, 2), "Called with an array-like object as the `this` value");
    },
    "each": function(testcase){
      var source = fuse.Array(1, 2, 3, 4, 5), thisArg = {"foo": "bar"};
      source.each(function(item, index, array){
        testcase.assertIdentical(1, item);
        testcase.assertIdentical(0, index);
        testcase.assertIdentical(source, array);
        testcase.assertIdentical(thisArg, this);
        return false;
      }, thisArg);
      
      var results = fuse.Array();
      fuse.Array.plugin.each.call(this.iterable, function(value){
        results.push(value);
      });
      
      this.assertEquivalent([0, 2], results, "Called with an array-like object as the `this` value");
    },
    "every": function(){
      this.assert(fuse.Array().every());
      this.assert(fuse.Array(true, true, true).every());
      this.refute(fuse.Array(true, false, false).every());
      this.refute(fuse.Array(false, false, false).every());
      
      var basic = fuse.Array(1, 2, 3);
      this.assert(basic.every(function(value){
        return value > 0;
      }));
      this.refute(basic.every(function(value){
        return value > 1;
      }));
      
      this.assert(fuse.Array.plugin.every.call(this.iterable, function(value){
        return value != nil;
      }), "Called with an array-like object as the `this` value");
    }
  });
  
}());
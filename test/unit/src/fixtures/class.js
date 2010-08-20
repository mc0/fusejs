
var Fixtures = {
  'Person': function(name){
    this.name = name;
  },

  'Animal': fuse.Class({
    'initialize': function(name) {
      this.name = name;
    },

    'eat': function() {
      return this.say('Yum!');
    },

    'say': function(message) {
      return this.name + ': ' + message;
    }
  }),

  // mixins
  'Sellable': {
    'getValue': function(pricePerKilo) {
      return this.weight * pricePerKilo;
    },

    'inspect': function() {
      return fuse.String('#<Sellable: #{weight}kg>').interpolate(this);
    }
  },

  'Reproduceable': {
    'reproduce': function(partner) {
      if (partner.constructor != this.constructor || partner.sex == this.sex)
        return null;
      var weight = this.weight / 10,
       sex = Math.random(1).round() ? 'male' : 'female';
      return new this.constructor('baby', weight, sex);
    }
  }
};

/*--------------------------------------------------------------------------*/

fuse.Object.extend(Fixtures, {
  // empty subclass
  'Mouse': fuse.Class(Fixtures.Animal),

  // subclass that augments a method
  'Cat': fuse.Class(Fixtures.Animal, {
    'eat': function(food) {
      if (food instanceof Fixtures.Mouse)
        return this.callSuper(arguments);
      else return this.say('Yuk! I only eat mice.');
    }
  }),

  // subclass with mixin
  'Dog': fuse.Class(Fixtures.Animal,
    /* plugins */
    {
      'constructor': function(name, weight, sex) {
        this.callSuper(arguments);
        this.weight = weight;
        this.sex    = sex;
      }
    },
    /* mixins */
    Fixtures.Reproduceable),

  // subclass with mixins
  'Ox': fuse.Class(Fixtures.Animal,
    /* plugins */
    {
      'initialize': function(name, weight, sex) {
        this.callSuper(arguments);
        this.weight = weight;
        this.sex    = sex;
      },

      'eat': function(food) {
        if (food instanceof Fixtures.Plant)
          this.weight += food.weight;
      },

      'inspect': function() {
        return fuse.String('#<Ox: #{name}>').interpolate(this);
      }
    },
    /* mixins */
    [Fixtures.Sellable, Fixtures.Reproduceable]),

  // base class with mixin
  'Plant': fuse.Class(
    /* plugins */
    {
      'initialize': function(name, weight) {
        this.name   = name;
        this.weight = weight;
      },

      'inspect': function() {
        return fuse.String('#<Plant: #{name}>').interpolate(this);
      }
    },
    /* mixins */
    Fixtures.Sellable)
});
new Test.Unit.Runner({

  'testTemplateParsing': function() {
    var source = '<tr><td>#{name}</td><td>#{age}</td></tr>',
     person    = { 'name': 'Sam', 'age': 21 },
     template  = fuse.Template(source);

    this.assertEqual('<tr><td>Sam</td><td>21</td></tr>',
      template.parse(person),
      'Regular object');
      
    this.assertEqual('<tr><td>Sam</td><td>21</td></tr>',
      template.parse($H(person)),
      'Hash object');

    this.assertEqual('<tr><td></td><td></td></tr>',
      template.parse({ }),
      'Empty object');
  },

  'testTemplateParsingWithEmptyReplacement': function() {
    var template = fuse.Template('##{}');
    this.assertEqual('#', template.parse());
    this.assertEqual('#', template.parse(null));
    this.assertEqual('#', template.parse({ }));
    this.assertEqual('#', template.parse({ 'foo': 'bar' }));

    template = fuse.Template('#{}');
    this.assertEqual('', template.parse({ }));
  },

  'testTemplateParsingWithFalses': function() {
    var source = '<tr><td>#{zero}</td><td>#{_false}</td><td>#{undef}</td><td>#{_null}</td><td>#{empty}</td></tr>',
     falses    = { 'zero':0, '_false':false, 'undef':undef, '_null':null, 'empty':'' },
     template  = fuse.Template(source);

    this.assertEqual('<tr><td>0</td><td>false</td><td></td><td></td><td></td></tr>',
      template.parse(falses));
  },

  'testTemplateParsingWithNested': function() {
    var source  = '#{name} #{manager.name} #{manager.age} #{manager.undef} #{manager.age.undef} #{colleagues.first.name}';

    var man = function(options){ fuse.Object.extend(this, options) };
    man.prototype.gender = 'Male';

    var worker = new man({
      'colleagues': { 'first': { 'name': 'Mark' } },
      'manager':    new man({ 'name': 'John', 'age': 29 }),
      'name':       'Stephan',
      'age':        22
    });

    this.assertEqual('Stephan', fuse.Template('#{name}').parse(worker));
    this.assertEqual('John',    fuse.Template('#{manager.name}').parse(worker));
    this.assertEqual('29',      fuse.Template('#{manager.age}').parse(worker));
    this.assertEqual('',        fuse.Template('#{manager.undef}').parse(worker));
    this.assertEqual('',        fuse.Template('#{manager.age.undef}').parse(worker));
    this.assertEqual('Mark',    fuse.Template('#{colleagues.first.name}').parse(worker));
    this.assertEqual('Stephan John 29   Mark', fuse.Template(source).parse(worker));

    // test inherited properties
    this.assertEqual('', fuse.Template('#{manager.gender}').parse(worker),
      'Template should not parse inherited properties.');
  },

  'testTemplateParsingWithIndexing': function() {
    var source = '#{0} = #{[0]} - #{1} = #{[1]} - #{[2][0]} - #{[2].name} - #{first[0]} - #{[first][0]} - #{[\\]]} - #{first[\\]]}',
     subject   = ['zero', 'one', ['two-zero']];

    subject[2].name    = 'two-zero-name';
    subject.first      = subject[2];
    subject[']']       = '\\';
    subject.first[']'] = 'first\\';

    this.assertEqual('zero',          fuse.Template('#{[0]}').parse(subject));
    this.assertEqual('one',           fuse.Template('#{[1]}').parse(subject));
    this.assertEqual('two-zero',      fuse.Template('#{[2][0]}').parse(subject));
    this.assertEqual('two-zero-name', fuse.Template('#{[2].name}').parse(subject));
    this.assertEqual('two-zero',      fuse.Template('#{first[0]}').parse(subject));
    this.assertEqual('\\',            fuse.Template('#{[\\]]}').parse(subject));
    this.assertEqual('first\\',       fuse.Template('#{first[\\]]}').parse(subject));

    this.assertEqual('empty - empty2',
      fuse.Template('#{[]} - #{m[]}').parse({ '': 'empty', 'm': { '': 'empty2' } }));

    this.assertEqual('zero = zero - one = one - two-zero - two-zero-name - two-zero - two-zero - \\ - first\\',
      fuse.Template(source).parse(subject));
  },

  'testTemplateToTemplateReplacements': function() {
    var source = 'My name is #{name}, my job is #{job}';

    var subject = {
      'name': 'Stephan',
      'getJob': function() { return 'Web developer' },
      'toTemplateReplacements': function() { return { 'name': this.name, 'job': this.getJob() } }
    };

    this.assertEqual('My name is Stephan, my job is Web developer',
      fuse.Template(source).parse(subject));

    // test null return value of toTemplateReplacements()
    source  = 'My name is "#{name}", my job is "#{job}"';
    subject = { 'toTemplateReplacements': fuse.K };
    this.assertEqual('My name is "", my job is ""',
      fuse.Template(source).parse(subject));

    source = 'My name is "\\#{name}", my job is "\\#{job}"';
    this.assertEqual('My name is "#{name}", my job is "#{job}"',
      fuse.Template(source).parse(subject));
  },

  'testTemplateParsingCombined': function() {
    var source = '#{name} is #{age} years old, managed by #{manager.name}, #{manager.age}.\n' +
      'Colleagues include #{colleagues[0].name} and #{colleagues[1].name}.';

    var subject = {
      'name':       'Stephan',
      'age':        22,
      'manager':    { 'name': 'John', 'age': 29 },
      'colleagues': [ { 'name': 'Mark' }, { 'name': 'Indy' } ]
    };
 
    this.assertEqual('Stephan is 22 years old, managed by John, 29.\n' +
      'Colleagues include Mark and Indy.',
      fuse.Template(source).parse(subject));
  },

  'testTemplateParsingDuplicates': function() {
    var source = '<td class="#{name}" title="#{name}">#{value}</td>',
     subject = { 'name': 'sales', 'value': 'towel' };

    this.assertEqual('<td class="sales" title="sales">towel</td>',
      fuse.Template(source).parse(subject),
      'Template should replace duplicate tokens.');
  }
});
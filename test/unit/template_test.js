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
    subject = { 'toTemplateReplacements': fuse.Function.IDENTITY };
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
  },

  'testStringInterpolate': function() {
    var subject = { 'name': 'Stephan' },
     pattern    = /(^|.|\r|\n)(#\((.*?)\))/;

    this.assertEqual('#{name}: Stephan',
      fuse.String('\\#{name}: #{name}').interpolate(subject));

    this.assertEqual('#(name): Stephan',
      fuse.String('\\#(name): #(name)').interpolate(subject, pattern));
  },

  'testStringGsubWithReplacementFunction': function() {
    var source = fuse.String('foo boo boz');

    this.assertEqual('Foo Boo BoZ',
      source.gsub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }));

    this.assertEqual('f2 b2 b1z',
      source.gsub(/o+/, function(match) {
        return match[0].length;
      }));

    this.assertEqual('f0 b0 b1z',
      source.gsub(/o+/, function(match) {
        return match[0].length % 2;
      }));
  },

  'testStringGsubWithReplacementString': function() {
    var expected,
     source = fuse.String('foo boo boz');

    this.assertEqual('foobooboz',
      source.gsub(/\s+/, ''));
    this.assertEqual('  z',
      source.gsub(/(.)(o+)/, ''));

    source = '\u00e3\u00a6\u00e3\u00a3\u00e3\u00a1\u00e3\u00b3\u00e3' +
      '\u00ba2007\n\u00e3\u00af\u00e3\u00ab\u00e3\u00bc\u00e3\u00ba\u00e3' +
      '\u00b3\u00e3\u00ac\u00e3\u00af\u00e3\u00b7\u00e3\u00a7\u00e3\u00b3';

    expected = source.replace(/\n/g, '<br/>');

    this.assertEqual(expected, fuse.String(source).gsub(/\n/,'<br/>'));
    this.assertEqual(expected, fuse.String(source).gsub('\n','<br/>'));
  },

  'testStringGsubWithReplacementTemplateString': function() {
    var source = fuse.String('foo boo boz');

    this.assertEqual('-oo-#{1}- -oo-#{1}- -o-#{1}-z',
      source.gsub(/(.)(o+)/, '-#{2}-\\#{1}-'));

    this.assertEqual('-foo-f- -boo-b- -bo-b-z',
      source.gsub(/(.)(o+)/, '-#{0}-#{1}-'));

    this.assertEqual('-oo-f- -oo-b- -o-b-z',
      source.gsub(/(.)(o+)/, '-#{2}-#{1}-'));

    this.assertEqual('  z',
      source.gsub(/(.)(o+)/, '#{3}'));
  },

  'testStringGsubEscapesRegExpSpecialCharacters': function() {
    this.assertEqual('happy Smyle',
      fuse.String('happy :-)').gsub(':-)', 'Smyle'));

    this.assertEqual('sad Frwne',
      fuse.String('sad >:($').gsub('>:($', 'Frwne'));

    this.assertEqual('ab', fuse.String('a|b').gsub('|', ''));
    this.assertEqual('ab', fuse.String('ab(?:)').gsub('(?:)', ''));
    this.assertEqual('ab', fuse.String('ab()').gsub('()', ''));
    this.assertEqual('ab', fuse.String('ab').gsub('^', ''));
    this.assertEqual('ab', fuse.String('a?b').gsub('?', ''));
    this.assertEqual('ab', fuse.String('a+b').gsub('+', ''));
    this.assertEqual('ab', fuse.String('a*b').gsub('*', ''));
    this.assertEqual('ab', fuse.String('a{1}b').gsub('{1}', ''));
    this.assertEqual('ab', fuse.String('a.b').gsub('.', ''));
  },

  'testStringSubstitutionEdgeCases': function() {
    var source = fuse.String('abc');

    this.assertEqual('-a-b-c-',
      source.gsub('', '-'),
      'empty string');

    this.assertEqual('--b-c-',
      source.gsub(/a|/, '-'),
      'empty matching pattern');

    this.assertEqual('-bc',
      source.gsub(/A/i, '-'),
      'case insensitive flag');

    this.assertEqual('-bc',
      source.sub(/./g, '-'),
      'sub with global flag');

    this.assertEqual('anullc',
      source.sub('b', function() { return null }),
      '`null` not returned');

    this.assertEqual('aundefinedc',
      source.sub('b', fuse.Function.NOP),
      '`undefined` not returned');

    // test with empty pattern (String#gsub is used by String#sub)
    source = fuse.String('ab');
    var empty = new RegExp('');

    this.assertEqual('xaxbx', source.gsub('', 'x'));
    this.assertEqual('xaxbx', source.gsub(empty, 'x'));
    this.assertEqual('xab',   source.sub('', 'x'));

    this.assertEqual('abc', fuse.String('anullc').sub(null, 'b'));
    this.assertEqual('abc', fuse.String('aundefinedc').gsub(undef, 'b'));
    this.assertEqual('abc', fuse.String('a0c').sub(0, 'b'));
    this.assertEqual('abc', fuse.String('atruec').gsub(true, 'b'));
    this.assertEqual('abc', fuse.String('afalsec').sub(false, 'b'));

    this.assertEqual('---a---b---', source.gsub(empty, '-#{0}-#{1}-'));
    this.assertEqual('++a++b++',    source.gsub('', function(match) {
      return '+' + match[0] + '+';
    }));

    // test using the global flag (should not hang)
    this.assertEqual('abc',         fuse.String('axc').sub(/x/g, 'b'));
    this.assertEqual('abbacadabba', fuse.String('axxacadaxxa').gsub(/x/g, 'b'));
    this.assertEqual('abbacadabba', fuse.String('axxacadaxxa').gsub(new RegExp('x','g'), 'b'));
  },

  'testStringSubWithReplacementFunction': function() {
    var source = fuse.String('foo boo boz');

    this.assertEqual('Foo boo boz',
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }), 1);

    this.assertEqual('Foo Boo boz',
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }, 2), 2);

    this.assertEqual(source,
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }, 0), 0);

    this.assertEqual(source,
      source.sub(/[^o]+/, function(match) {
        return match[0].toUpperCase()
      }, -1), -1);
  },

  'testStringSubWithReplacementString': function() {
    var source = fuse.String('foo boo boz');

    this.assertEqual('oo boo boz',
      source.sub(/[^o]+/, ''));

    this.assertEqual('oooo boz',
      source.sub(/[^o]+/, '', 2));

    this.assertEqual('-f-oo boo boz',
      source.sub(/[^o]+/, '-#{0}-'));

    this.assertEqual('-f-oo- b-oo boz',
      source.sub(/[^o]+/, '-#{0}-', 2));
  },

  'testStringScan': function() {
    var source  = fuse.String('foo boo boz');
    var results = [];
    var str     = source.scan(/[o]+/, function(match) {
      results.push(match[0].length);
    });

    this.assertEnumEqual([2, 2, 1], results);
    this.assertEqual(source, source.scan(/x/, this.fail));
    this.assert(fuse.Object.isString(str));
  }
});
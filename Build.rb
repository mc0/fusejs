#!/usr/bin/env ruby

require "fileutils"
require "erb"
require "optparse"

module FuseJS
  #Build constants
  BUILD = {
    "Version" => "Alpha",
    "Built" => Time.now.strftime("%a. %b %d %Y %H:%M:%S %Z")
  }
  #Path constants
  ROOT_PATH = File.expand_path(File.dirname(__FILE__))
  SOURCE_PATH = File.join(ROOT_PATH, "src")
  FINAL_PATH = File.join(ROOT_PATH, "dist")
  TEST_PATH = File.join(ROOT_PATH, "test")
  #This is a slimmed-down, slightly modified version of Sam Stephenson's Sprockets <http://getsprockets.org>
  module Builder
    class << self
      def absolute?(location)
        return location[0, 1] == File.expand_path(location)[0, 1] || (RUBY_PLATFORM =~ /(win|w)32$/ ? location[0, 1] == File::SEPARATOR && File.expand_path(location) =~ /[A-Za-z]:[\/\\]/ : false)
      end
    end
    class Generator
      attr_reader :environment, :preprocessor
      DEFAULT_OPTIONS = {:root => ".", :load_path => [], :source_files => [], :constants => {}}
      def initialize(options = {})
        @options = DEFAULT_OPTIONS.merge(options)
        @environment  = Environment.new(@options[:root], @options[:constants])
        @preprocessor = Preprocessor.new(environment)
        @options[:load_path].map {|path| Dir[Builder.absolute?(path) ? path : File.join(@options[:root], path)].sort}.flatten.compact.each {|load_location| environment.register_load_location(load_location)}
        @options[:source_files].map {|path| Dir[Builder.absolute?(path) ? path : File.join(@options[:root], path)].sort}.flatten.compact.each do |source_file|
          if pathname = environment.find(source_file)
            preprocessor.require(pathname.source_file)
          else
            raise LoadError, "The source file `#{source_file}` was not found."
          end
        end
      end
      def concatenation
        preprocessor.concatenation
      end
    end
    class Pathname
      attr_reader :environment, :absolute_location
      def initialize(environment, absolute_location)
        @environment = environment
        @absolute_location = File.expand_path(absolute_location)
      end
      def find(location)
        location = File.join(absolute_location, location)
        File.file?(location) ? Pathname.new(environment, location) : nil
      end
      def source_file
        Script.new(environment, self)
      end
      def ==(pathname)
        environment == pathname.environment && absolute_location == pathname.absolute_location
      end
      def to_s
        absolute_location
      end
    end
    class Environment
      attr_reader :root, :load_path, :constants
      def initialize(root, constants = {})
        @load_path = [@root = Pathname.new(self, root)]
        @constants = constants
      end
      def pathname_from(location)
        location = location.to_s
        location = File.join(root.absolute_location, location) unless Builder.absolute?(location)
        Pathname.new(self, File.expand_path(location))
      end
      def register_load_location(location)
        pathname = pathname_from(location)
        load_path.delete(pathname)
        load_path.unshift(pathname)
        location
      end
      def find(location)
        if Builder.absolute?(location) && File.exists?(location)
          pathname_from(location)
        else
          load_path.map {|pathname| pathname.find(location)}.compact.first
        end
      end
    end
    class Concatenation
      attr_reader :lines, :mtimes
      def initialize
        @lines = []
        @mtimes = []
      end
      def record(line)
        lines << line
        mtimes.push(line.source_file.mtime)
        line
      end
      def to_s
        lines.join
      end
      def save_to(filename)
        timestamp = mtimes.max
        File.open(filename, "w") {|file| file.write(to_s)}
        File.utime(timestamp, timestamp, filename)
        true
      end
    end
    class Preprocessor
      attr_reader :environment, :concatenation, :source_files
      def initialize(environment)
        @environment = environment
        @concatenation = Concatenation.new
        @source_files = []
      end
      def require(source_file)
        return if source_files.include?(source_file)
        source_files << source_file
        source_file.lines.each do |source_line|
          directive = source_line.line[/^\s*\/\/=\s+require\s+(\"(.*?)\"|<(.*?)>)\s*$/, 1]
          if directive
            relative = directive[/^(.)/, 1] == '"'
            location = begin
              location = directive[/^.(.*).$/, 1]
              File.join(File.dirname(location), File.basename(location, ".js") + ".js")
            end
            pathname = (relative ? source_line.source_file : environment).find(location)
            raise LoadError, "The file `#{File.split(location).last}` for #{relative ? "relative inclusion" : "inclusion"} was not found (#{source_line.inspect})." unless pathname
            require pathname.source_file
          else
            concatenation.record(source_line)
          end
        end
      end
    end
    class Line
      attr_reader :source_file, :line, :number
      def initialize(source_file, line, number)
        @source_file = source_file
        @line = line
        @number = number
      end
      def inspect
        "Line #{@number}, File: #{@source_file.pathname}"
      end
      def to_s
        line.chomp.gsub(/<%=(.*?)%>/) {
          constant = $1.strip
          if value = source_file.environment.constants[constant]
            value
          else
            raise LoadError, "No such constant: `#{constant}` (#{inspect})."
          end
        }.gsub(/\s+$/, "") + $/
      end
    end
    class Script
      attr_reader :environment, :pathname
      def initialize(environment, pathname)
        @environment = environment
        @pathname = pathname
      end
      def lines
        @lines = []
        File.open(pathname.absolute_location) {|file| file.each {|line| @lines << Line.new(self, line, file.lineno)}}
        @lines
      end
      def find(location)
        Pathname.new(environment, File.dirname(pathname.absolute_location)).find(location)
      end
      def ==(source_file)
        pathname == source_file.pathname
      end
      def mtime
        File.mtime(pathname.absolute_location) rescue Errno::ENOENT Time.now
      end
    end
  end
  module LegacyTests
    #Path constants
    ROOT_PATH = File.join(FuseJS::TEST_PATH, "unit", "legacy")
    TEST_PATH = File.join(ROOT_PATH, "source")
    FIXTURES_PATH = File.join(TEST_PATH, "fixtures")
    FINAL_PATH = File.join(ROOT_PATH, "build")
    class Generator
      def initialize(filename)
        @filename = filename
        @template = File.join(ROOT_PATH, "resources", "template.erb")
        @js_filename = File.basename(@filename)
        @basename = File.basename(@js_filename, "_test.js")
      end
      def render
        @title = @basename.gsub("_", " ").strip.capitalize
        @html_fixtures = begin
          content = ""
          file = File.join(FIXTURES_PATH, "#{@basename}.html")
          File.open(file).each {|line| content << line} if File.exists? file
          content
        end

        @js_fixtures_filename = "#{@basename}.js" if File.exists?(File.join(FIXTURES_PATH, "#{@basename}.js"))
        @css_fixtures_filename = "#{@basename}.css" if File.exists?(File.join(FIXTURES_PATH, "#{@basename}.css"))

        File.open(File.join(FINAL_PATH, "#{File.basename(@filename, ".js")}.html"), "w") do |file|
          file << ERB.new(File.read(@template), nil, "%").result(binding)
        end
      end
    end
  end
  class << self
    include FileUtils
    def build_distribution
      puts "Building FuseJS..."
      secretary = Builder::Generator.new(
        :root => SOURCE_PATH,
        :load_path => [SOURCE_PATH],
        :source_files => ["fuse.js"],
        :constants => FuseJS::BUILD
      )
      mkdir_p FINAL_PATH
      secretary.concatenation.save_to File.join(FINAL_PATH, "fuse.js")
      puts "Done."
    end
    def build_legacy_tests
      build_distribution
      puts "Building legacy unit tests..."
      #Always start from scratch
      rm_rf LegacyTests::FINAL_PATH
      mkdir_p LegacyTests::FINAL_PATH
      Dir.glob(File.join(LegacyTests::TEST_PATH, "*_test.js")).each do |file|
        LegacyTests::Generator.new(file).render
      end
      puts "Done."
    end
  end
end

parser = OptionParser.new do |options|
  options.summary_width = 15
  options.banner = "Usage: ruby Build.rb [options]"
  def options.show_usage
    puts self
    exit
  end
  options.on("-d", "--dist", "Generate the composite file in `dist/` using ERB.") do
    FuseJS.build_distribution
  end
  options.on("-t", "--test", "Build the legacy unit tests in `test/unit/legacy/build/`.") do
    FuseJS.build_legacy_tests
  end
  options.on_tail("-h", "--help", "Shows this help message") do
    options.show_usage
  end
  if ARGV.empty?
    options.show_usage
  end
end

begin
  parser.parse!
rescue OptionParser::ParseError => exception
  parser.warn exception.message
  parser.show_usage
end
#!/usr/bin/env ruby

require "fileutils"
require "erb"
require "optparse"

module FuseJS
  VERSION = "Alpha"
  ROOT_PATH = File.expand_path(File.dirname(__FILE__))
  SOURCE_PATH = File.join(ROOT_PATH, "src")
  DIST_PATH = File.join(ROOT_PATH, "dist")
  TEST_PATH = File.join(ROOT_PATH, "test")
  TEMP_PATH = File.join(TEST_PATH, "unit", "tmp")
  module Builder
    module Environment
      def include(*filenames)
        filenames.map {|filename| Preprocessor.new(filename).to_s}.join("\n")
      end
    end
    class Preprocessor
      include Environment
      def initialize(filename)
        @filename = File.expand_path(filename)
        @template = ERB.new File.read(@filename), nil, "%"
      end
      def to_s
        (@template.result(binding).split($/).map {|line| line.gsub(/\s+$/, '')} * $/) + "\n"
      end
    end
    class << self
      include FileUtils
      def build
        puts "Building FuseJS..."
        mkdir_p DIST_PATH
        Dir.chdir(SOURCE_PATH) do 
          File.open File.join(DIST_PATH, "fuse.js"), "w" do |dist|
            dist << Preprocessor.new("fuse.js")
          end
        end
        puts "Done."
      end
    end
  end
  module TestBuilder
    class PageBuilder
      UNITTEST_DIR  = File.expand_path('test')
      FIXTURES_DIR  = File.join(UNITTEST_DIR, 'unit', 'fixtures')
      TMP_DIR       = File.join(UNITTEST_DIR, 'unit', 'tmp')
      TEMPLATES_DIR = File.join(UNITTEST_DIR, 'lib', 'templates')

      def initialize(filename, template = 'default.erb')
        @filename          = filename
        @template          = File.join(self.class::TEMPLATES_DIR, template)
        @js_filename       = File.basename(@filename)
        @basename          = @js_filename.sub('_test.js', '')
      end

      def html_fixtures
        content = ""
        file = File.join(FIXTURES_DIR, "#{@basename}.html")
        File.open(file).each { |l| content << l } if File.exists?(file)
        content
      end

      def external_fixtures(extension)
        filename = "#{@basename}.#{extension}"
        File.exists?(File.join(FIXTURES_DIR, filename)) ? filename : nil
      end

      def render
        @title                 = @basename.gsub('_', ' ').strip.capitalize
        @html_fixtures         = html_fixtures
        @js_fixtures_filename  = external_fixtures('js')
        @css_fixtures_filename = external_fixtures('css')

        File.open(destination, 'w+') do |file|
          file << ERB.new(IO.read(@template), nil, '%').result(binding)
        end
      end

      def destination
        name_file(:ext => 'html')
      end

      def name_file(options = {})
        prefix = options[:prefix] ? "#{options[:prefix]}_" : ""
        suffix = options[:suffix] ? "_#{options[:suffix]}" : ""
        ext    = options[:ext] ? options[:ext] : "js"
        filename = File.basename(@filename, '.js')
        File.join(TMP_DIR, "#{prefix}#{filename}#{suffix}.#{ext}")
      end
    end
    class << self
      include FileUtils
      def build
        Builder.build
        puts "Building old unit tests..."
        #Always start from scratch...
        rm_rf TEMP_PATH
        mkdir_p TEMP_PATH
        Dir.glob(File.join('test', 'unit', '*_test.js')).each do |file|
          PageBuilder.new(file, "fuse.erb").render
        end
        puts "Done."
      end
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
    FuseJS::Builder.build
  end
  options.on("-t", "--test", "Build the old unit tests in `test/unit/tmp/`.") do
    FuseJS::TestBuilder.build
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
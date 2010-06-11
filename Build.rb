#!/usr/bin/env ruby

require "fileutils"
require "erb"
require "optparse"

module FuseJS
  VERSION = "Alpha"
  #Path constants
  ROOT_PATH = File.expand_path(File.dirname(__FILE__))
  SOURCE_PATH = File.join(ROOT_PATH, "src")
  FINAL_PATH = File.join(ROOT_PATH, "dist")
  TEST_PATH = File.join(ROOT_PATH, "test")
  module Builder
    module Distribution
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
        mkdir_p FINAL_PATH
        Dir.chdir(SOURCE_PATH) do 
          File.open File.join(FINAL_PATH, "fuse.js"), "w" do |dist|
            dist << Distribution::Preprocessor.new("fuse.js")
          end
        end
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
end

parser = OptionParser.new do |options|
  options.summary_width = 15
  options.banner = "Usage: ruby Build.rb [options]"
  def options.show_usage
    puts self
    exit
  end
  options.on("-d", "--dist", "Generate the composite file in `dist/` using ERB.") do
    FuseJS::Builder.build_distribution
  end
  options.on("-t", "--test", "Build the legacy unit tests in `test/unit/legacy/build/`.") do
    FuseJS::Builder.build_legacy_tests
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
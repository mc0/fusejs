#!/usr/bin/env ruby

require "fileutils"

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
  class << self
    def build!
      puts "Building FuseJS..."
      builder = Builder.new(:root => ROOT_PATH, :search => [SOURCE_PATH], :files => ["fuse.js"], :constants => BUILD, :comments => true)
      FileUtils.mkdir_p FINAL_PATH
      builder.save File.join(FINAL_PATH, "fuse.js")
      puts "Done. Building legacy unit tests..."
      #Always start from scratch
      FileUtils.rm_rf LegacyTestGenerator::FINAL_PATH
      FileUtils.mkdir_p LegacyTestGenerator::FINAL_PATH
      Dir[File.join(LegacyTestGenerator::TEST_PATH, "*_test.js")].each do |file|
        LegacyTestGenerator.new(file).render
      end
      puts "Done."
    end
  end
  #Based on work by Sam Stephenson <http://getsprockets.org>
  class Builder
    class << self
      def absolute?(location)
        return location[0, 1] == File.expand_path(location)[0, 1] || (RUBY_PLATFORM =~ /(win|w)32$/ ? location[0, 1] == File::SEPARATOR && File.expand_path(location) =~ /[A-Za-z]:[\/\\]/ : false)
      end
    end
    DEFAULT_OPTIONS = {:root => ".", :search => [], :files => [], :constants => {}, :comments => false}
    def initialize(options = {})
      @options = DEFAULT_OPTIONS.merge(options)
      @concatenation = {
        :filenames => [],
        :mtimes => [],
        :lines => []
      }
      @options[:search].map! {|path| Dir[Builder.absolute?(path) ? path : File.expand_path(File.join(@options[:root], path))]}.flatten!.compact!
      @options[:files].each do |file|
        if location = find(file)
          concatenate location
        else
          raise LoadError, "The source file `#{file}` was not found."
        end
      end
    end
    def find(filename)
      Builder.absolute?(filename) ? (File.file?(filename) ? filename : nil) : @options[:search].map {|path|
        find File.expand_path(File.join(path, filename))
      }.compact.first
    end
    def concatenate(filename)
      return if @concatenation[:filenames].include?(filename)
      @concatenation[:filenames] << filename
      @concatenation[:mtimes] << File.mtime(filename) || Time.now
      File.open(filename, "r") do |file|
        file.each do |line|
          comment = line[/^\s*\/\/(.*)/, 1]
          directive = (comment || "")[/^=\s+require\s+(\"(.*?)\"|<(.*?)>)\s*$/, 1]
          if directive
            dependency = directive[/^.(.*).$/, 1].chomp(".js") + ".js"
            path = directive[/^(.)/, 1] == '"' ? File.join(File.expand_path(File.dirname(filename)), dependency) : dependency
            raise LoadError, "The file `#{path}` was not found (Line #{file.lineno}, File: #{filename})." unless (location = find path) && concatenate(location)
          else
            @concatenation[:lines] << line.chomp.gsub(/<%=(.*?)%>/) {
              constant = $1.strip
              (value = @options[:constants][constant]) ? value : constant
            }.gsub(/\s+$/, "") + $/ unless (comment && !@options[:comments])
          end
        end
      end
    end
    def save(output)
      timestamp = @concatenation[:mtimes].max
      File.open(output, "w") {|file| file.write(@concatenation[:lines].join)}
      File.utime(timestamp, timestamp, output)
      true
    end
  end
  class LegacyTestGenerator
    require "erb"
    #Path constants
    ROOT_PATH = File.join(FuseJS::TEST_PATH, "unit", "legacy")
    TEST_PATH = File.join(ROOT_PATH, "source")
    FIXTURES_PATH = File.join(TEST_PATH, "fixtures")
    FINAL_PATH = File.join(ROOT_PATH, "build")
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
        File.open(file, "r") {|file| file.each{|line| content << line}} if File.file?(file)
        content
      end

      @js_fixtures_filename = "#{@basename}.js" if File.file?(File.join(FIXTURES_PATH, "#{@basename}.js"))
      @css_fixtures_filename = "#{@basename}.css" if File.file?(File.join(FIXTURES_PATH, "#{@basename}.css"))

      File.open(File.join(FINAL_PATH, "#{File.basename(@filename, ".js")}.html"), "w") do |file|
        file << ERB.new(File.read(@template), nil, "%").result(binding)
      end
    end
  end
end

FuseJS.build!
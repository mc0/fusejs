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
  DIST_PATH = File.join(ROOT_PATH, "dist")
  TEST_PATH = File.join(ROOT_PATH, "test")
  def self.build!
    puts "Building FuseJS..."
    builder = Builder.new(:root => ROOT_PATH, :search => [SOURCE_PATH], :files => ["fuse.js"], :constants => BUILD, :comments => true)
    FileUtils.mkdir_p DIST_PATH
    builder.save! File.join(DIST_PATH, "fuse.js"), File.join(DIST_PATH, "docs.md")
    #Experimental: create a distribution file (strip named function expressions and JScript NFE bug fixes).
    File.open(File.join(DIST_PATH, "fuse.dist.js"), "wb") {|file| file << File.read(File.join(DIST_PATH, "fuse.js")).gsub(/\=[^\w]+function\s[^(]+\(/, "= function(").gsub(/^\s+\/\/\sprevent JScript bug[^}]+/, "")}
    puts "Done. Building legacy unit tests..."
    #Always start from scratch
    FileUtils.rm_rf LegacyTestGenerator::BUILD_PATH
    FileUtils.mkdir_p LegacyTestGenerator::BUILD_PATH
    Dir[File.join(LegacyTestGenerator::TEST_PATH, "*_test.js")].each do |file|
      LegacyTestGenerator.new(file).render
    end
    puts "Done."
  end
  #A miniature, Sprockets-like JavaScript preprocessor. Credits: Sam Stephenson <http://getsprockets.org>
  class Builder
    def self.absolute?(location)
      #A workaround for detecting absolute paths on Windows
      return location[0, 1] == File.expand_path(location)[0, 1] || (RUBY_PLATFORM =~ /(win|w)32$/ ? location[0, 1] == File::SEPARATOR && File.expand_path(location) =~ /[A-Za-z]:[\/\\]/ : false)
    end
    DEFAULT_OPTIONS = {:root => ".", :search => [], :files => [], :constants => {}, :comments => false}
    def initialize(options = {})
      @options = DEFAULT_OPTIONS.merge(options)
      #The final concatenation object
      @concatenation = {:filenames => [], :mtimes => [], :lines => [], :docs => []}
      #The load paths to search
      @options[:search] = @options[:search].map {|path| Dir[Builder.absolute?(path) ? path : File.expand_path(File.join(@options[:root], path))]}.flatten.compact.sort
      #Load all source files for concatenation
      @options[:files].each do |file|
        raise "The source file `#{file}` was not found." unless location = find(file)
        preprocess location
      end
    end
    def find(filename)
      #Recursively search all load paths for a source file, returning the first match
      Builder.absolute?(filename) ? (File.file?(filename) ? filename : nil) : @options[:search].map {|path| find File.expand_path(File.join(path, filename))}.compact.first
    end
    def preprocess(filename)
      raise "The file `#{filename}` was not found." unless File.file?(filename)
      #Don't add the file to the concatenation if it's already included
      return if @concatenation[:filenames].include?(filename)
      #Record the filename in the list of included files so it's not included again
      @concatenation[:filenames] << filename
      #The file's modification time, or current time if it's not defined
      @concatenation[:mtimes] << File.mtime(filename) || Time.now
      #Collected documentation fragments
      fragments = []
      #Iterate through the file's lines; easier and less verbose than `File.open(...) {|file| file.each {|line| ...}}`.
      IO.readlines(filename).each do |line|
        comment = line[/^\s*\/\/(.*)/, 1]
        #Process all `require` directives
        if comment && require = comment[/^=\s+require\s+(\"(.*?)\"|<(.*?)>)\s*$/, 1]
          #Avoid appending the ".js" extension a second time if it's already appended
          name = require[/^.(.*).$/, 1].chomp(".js") + ".js"
          #Quotes denote paths relative to the file, angle brackets denote files in the load path(s)
          path = require[0, 1] === '"' ? File.join(File.expand_path(File.dirname(filename)), name) : name
          #Add the file to the concatenation.
          raise "The file `#{path}` was not found (File: #{filename})." unless file = find(path)
          preprocess file
        end
        #Interpolate constants
        line = line.chomp.gsub(/<%=(.*?)%>/){@options[:constants][$1.strip] || $&}.gsub(/\s+$/, "")
        #Process inline documentation (based on work by Tobie Langel; PDoc <http://pdoc.org>)
        if line =~ /^\s*\/\*\*(.*)/ || fragments.length > 0
          #Flag the line as a comment (stripped by default) and add it to our temporary fragments array
          comment = true
          fragments << line
          if line =~ /^(.*)\*\/\s*/
            #Generate the RegExp for stripping the documentation prefix from each line
            match = fragments[1].match(/(^\s*\*)(\s*)/)
            prefix = Regexp.new("^#{Regexp.escape(match[1])}(#{Regexp.escape(match[2])})?") if fragments.length > 2
            fragments.each_with_index do |entry, index|
              if index === 0
                #Strip opening doc comment
                @concatenation[:docs] << entry.sub(/\s*\/\*\*\s*/, "")
              elsif index === fragments.length - 1
                #Strip closing doc comment
                @concatenation[:docs] << entry.sub(/\s*\*\/\s*/, "")
              elsif entry =~ prefix
                #Strip prefix
                @concatenation[:docs] << entry.sub(prefix, "")
              else
                raise "Inconsistent documentation prefix (File: #{filename})."
              end
            end
            #Clear the fragments array
            fragments.clear
          end
        end
        #Add the line to the concatenation (skip comments and `require` directives)
        @concatenation[:lines] << line unless require || comment && !@options[:comments]
      end
    end
    def save!(concatenation, docs)
      #Get the latest source file's modification time
      timestamp = @concatenation[:mtimes].max
      #Write the concatenation and docs to their respective files
      File.open(concatenation, "wb") {|file| file << @concatenation[:lines].join($/)}
      File.open(docs, "wb") {|file| file << @concatenation[:docs].join($/)}
      #Set the access/modification times of both files
      [concatenation, docs].each {|file| File.utime(timestamp, timestamp, file)}
      true
    end
  end
  class LegacyTestGenerator
    require "erb"
    #Path constants
    ROOT_PATH = File.join(FuseJS::TEST_PATH, "unit")
    TEST_PATH = File.join(ROOT_PATH, "src")
    FIXTURES_PATH = File.join(TEST_PATH, "fixtures")
    BUILD_PATH = File.join(ROOT_PATH, "build")
    def initialize(filename)
      @filename = filename
      @template = File.join(ROOT_PATH, "assets", "template.erb")
      @js_filename = File.basename(@filename)
      @basename = File.basename(@js_filename, "_test.js")
    end
    def render
      @title = @basename.gsub("_", " ").strip.capitalize
      @html_fixtures = begin
        content = ""
        file = File.join(FIXTURES_PATH, "#{@basename}.html")
        content << IO.read(file) if File.file?(file)
      end

      @js_fixtures_filename = "#{@basename}.js" if File.file?(File.join(FIXTURES_PATH, "#{@basename}.js"))
      @css_fixtures_filename = "#{@basename}.css" if File.file?(File.join(FIXTURES_PATH, "#{@basename}.css"))

      File.open(File.join(BUILD_PATH, "#{File.basename(@filename, ".js")}.html"), "w") do |file|
        file << ERB.new(File.read(@template), nil, "%").result(binding)
      end
    end
  end
end

FuseJS.build!
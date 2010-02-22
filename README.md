<a href="http://fusejs.com">
<img title="FuseJS - Fuse to win!" alt="FuseJS Logo" style="border:0;" src="fusejs/raw/master/logo.png">
</a>

About Alpha
-----------

FuseJS is currently in alpha.

This means the code base is feature/API **incomplete**, **buggy**, and
**not** intended for production use.

Introduction
------------

JavaScript frameworks share similar features and functionality such as
DOM manipulation, event registration, and CSS selector engines. FuseJS 
attempts to incorporate the strengths of these frameworks into one stable, 
efficient, and optimized core JavaScript framework. 

FuseJS is the first JavaScript framework to use cross-browser/environment sandboxed 
natives. This allows extending Array, String, Number, Date, and RegExp objects without
polluting the native objects of the host environment.

FuseJS emphasizes browser capability testing, method forking, and lazy method 
definition for maintainability/performance. Modules and adapters are designed to 
allow customized builds, including one of seven supported CSS selector engines<sup><a name="fnref1" href="#fn1">1</a></sup>. Released under the MIT license, FuseJS follows ECMA 2.62
(*5th edition*) specifications, supports minification, and plans to add in-line documentation.

FuseJS will feature framework emulation<sup><a name="fnref2" href="#fn2">2</a></sup> by creating a shell of the target framework and mapping all API calls to FuseJS's core. As more frameworks are emulated the code base will gain bug fixes/features which are shared between all emulated frameworks. Because of FuseJS's optimized core each emulated framework should, as a whole, perform better than their official counterpart. Developers could simply replace a supported client-side framework with `FuseJS + emulation layer` and receive instant performance/stability gains while continuing to use their familiar framework API.

Tested browsers/environments
----------------------------
  - Microsoft Internet Explorer for Windows, 6.0 and higher
  - Mozilla Firefox 1.5 and higher
  - Google Chrome 1.0 and higher
  - Apple Safari 2.0.0 and higher
  - Opera 9.25 and higher
  - Konqueror 4.2.2 and higher

Building FuseJS from source
---------------------------
The `fuse.js` file is composed of many source files in the `src/` directory.

To build FuseJS, you'll need:

  - The FuseJS source tree from the Git repository (see below)
  - Ruby 1.8.2 or higher ([http://www.ruby-lang.org/](http://www.ruby-lang.org/))
  - Rake -- Ruby Make ([http://rake.rubyforge.org/](http://rake.rubyforge.org/))
  - RDoc, if your Ruby distribution does not include it

From the root FuseJS directory,

  - `rake dist` will preprocess the FuseJS source using ERB and 
    generate the composite `dist/fuse.js`.

Contributing to FuseJS
----------------------
Check out the FuseJS source with 
    $ git clone git://github.com/jdalton/fusejs.git
    $ cd fusejs
    $ git submodule init
    $ git submodule update

Community
---------
  - Discuss all things FuseJS in the IRC channel
    [#fusejs on irc.freenode.net](irc://irc.freenode.net/#fusejs).

  - Use the [FuseJS issue tracker](https://fusejs.lighthouseapp.com/projects/24813-fusejs/tickets?q=all)
    to report a bug or share an awesome enhancement. Before posting please read this
    [text formatting guide](http://help.lighthouseapp.com/faqs/getting-started/how-do-i-format-text).
    Lighthouse lacks the GUI to edit comments. However, you may install
    [this Greasemonkey script](http://userscripts.org/scripts/show/63702) or use
    [this bookmarklet](http://gist.github.com/251306) to insert the missing `edit` links.

Gotchas
-------
  - Firefox 3.6 changed the default value for `security.fileuri.strict_origin_policy` to `true`.
    You may need to change this to `false` in the `about:config` for running unit tests without `Rake`.

  - If `$ git submodule update` fails try deleting the contents of the `vendor` folder and performing
    `$ git submodule init` and `$ git submodule update` again.

Footnotes
---------
  1. The following CSS selector engines are supported
     <a name="fn1" title="Jump back to footnote 1 in the text." href="#fnref1">&#8617;</a>
     1. Acme <sup>*Dojo*</sup>
     2. DomQuery <sup>*ExtJS*</sup>
     3. NWMatcher <sup>*Default*</sup>
     4. Peppy
     5. Sizzle <sup>*jQuery*</sup>
     6. Slick <sup>*MooTools*</sup>
     7. Sly

  2. PrototypeJS emulation will be supported in the `beta` release.
     <a name="fn2" title="Jump back to footnote 2 in the text." href="#fnref2">&#8617;</a>

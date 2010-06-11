FuseJS
=======

[![Fuse to Win](fusejs/raw/master/logo.png)](http://fusejs.com)

**Note**: FuseJS is currently in *alpha*. This means that the API is **incomplete**, **buggy**, and **not** intended for production use.

JavaScript frameworks share similar features and functionality, such as DOM manipulation, event registration, and CSS selector engines. FuseJS attempts to incorporate the strengths of these frameworks into one stable, efficient, and optimized core JavaScript framework. 

FuseJS is the first framework to use cross-browser **[sandboxed natives](http://github.com/jdalton/fusebox#readme)**. This allows the extension of `Array`, `String`, `Number`, `Date`, and `RegExp` core objects, without polluting the native objects of the host environment.

FuseJS emphasizes browser capability testing, method forking, and lazy method definition for maintainability and performance. Modules and adapters are designed to allow customized builds, including one of seven supported CSS selector engines<sup><a name="fnref1" href="#fn1">1</a></sup>. FuseJS also follows ECMA 2.62 (*5th edition*) specifications, supports minification, and plans to add inline documentation.

Additionally, FuseJS will feature framework emulation<sup><a name="fnref2" href="#fn2">2</a></sup> by creating a shell of the target framework and mapping all API calls to the FuseJS core. As support for more frameworks is added, the code base will gain numerous bug fixes and features, which, in turn, will be shared among all emulated frameworks. Because the FuseJS core is highly optimized, each emulated framework should, holistically, perform better than its official counterpart. The implications are manifold: developers could simply replace a supported client-side framework with `FuseJS + Emulation Layer` and receive instant performance and stability gains, while continuing to use their familiar framework's API.

## Tested Browsers

- Microsoft [Internet Explorer](http://www.microsoft.com/windows/internet-explorer) for Windows, 6.0 and higher
- Mozilla [Firefox](http://www.mozilla.com/firefox) 1.5 and higher
- Google [Chrome](http://www.google.com/chrome) 1.0 and higher
- Apple [Safari](http://www.apple.com/safari) 2.0.0 and higher
- [Opera](http://www.opera.com) 9.25 and higher
- [Konqueror](http://www.konqueror.org) 4.2.2 and higher
- [SeaMonkey](http://www.seamonkey-project.org/) 1.0 and higher

## Getting and Building FuseJS

The FuseJS source code is hosted on [GitHub](http://github.com). Check out a working copy of the source tree with [Git](http://git-scm.com):

	$ git clone git://github.com/jdalton/fusejs.git
	$ cd fusejs
	$ git submodule init --update
	
To build FuseJS, you'll need [Ruby](http://www.ruby-lang.org) 1.8.2 or higher. From the repo's root directory, run:

- `ruby Build.rb -d` or `--dist` to concatenate the source files in the `src/` directory and generate the composite in `dist/fuse.js`
- `ruby Build.rb -t` or `--test` to build the legacy unit tests in `test/unit/legacy/build/`.
	
Once you fork FuseJS on GitHub and commit your changes, you may also [send a pull request](http://github.com/guides/pull-requests) if you'd like your feature or bug fix to be considered for the next release.

Please make sure to update all unit tests in the `test/` directory as well: although the legacy `unittest.js`-based tests are still  available, we're currently in the process of porting our unit tests to the [Scotch](http://kitgoncharov.github.com/scotch) testing library.

## Community

- Discuss all things FuseJS in the [#fusejs IRC channel](irc://irc.freenode.net/#fusejs) on irc.freenode.net.

- Use the [FuseJS issue tracker](https://fusejs.lighthouseapp.com/projects/24813-fusejs/tickets?q=all) to report a bug or share an awesome enhancement. Before posting, please read the Lighthouse [text formatting guide](http://help.lighthouseapp.com/faqs/getting-started/how-do-i-format-text). Additionally, Lighthouse lacks the GUI to edit comments; however, you may install [this Greasemonkey script](http://userscripts.org/scripts/show/63702) or use [this bookmarklet](http://gist.github.com/251306) to insert the missing `edit` links.

## Gotchas

- Firefox 3.6 changed the default value for `security.fileuri.strict_origin_policy` (in `about:config`) to `true`. **You may need to change this value** to `false` for running the Ajax unit tests locally.

- If `$ git submodule update --init` fails, try deleting the contents of the `vendor` folder and running the command again.

## Footnotes

1. The following CSS selector engines are supported<a name="fn1" title="Jump back to footnote 1 in the text." href="#fnref1">&#8617;</a>: [NWMatcher][1] (default), [Acme][2] (Dojo), [DomQuery][3] (ExtJS), [Sizzle][4] (jQuery), [Peppy][5], [Slick][6] (MooTools), and [Sly][7].
  
2. [Prototype](http://prototypejs.org) emulation will be supported in the beta version<a name="fn2" title="Jump back to footnote 2 in the text." href="#fnref2">&#8617;</a>.

[1]: http://github.com/dperini/nwmatcher
[2]: http://svn.dojotoolkit.org/src/dojo/trunk/_base/query.js
[3]: http://www.extjs.com/deploy/ext/docs/output/DomQuery.jss.html
[4]: http://sizzlejs.com/
[5]: http://jamesdonaghue.com/static/peppy
[6]: http://github.com/subtleGradient/slick
[7]: http://github.com/digitarald/sly
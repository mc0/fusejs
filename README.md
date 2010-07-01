FuseJS
=======

**Note**: FuseJS is currently in *alpha*. This means that the API is **incomplete**, **buggy**, and **not** intended for production use.


[![Fuse to Win](fusejs/raw/master/logo.png)](http://fusejs.com)

JavaScript frameworks share similar features and functionality, such as DOM manipulation, event registration, and CSS selector engines. FuseJS attempts to incorporate the strengths of these frameworks into one stable, efficient, and optimized core JavaScript framework. 

FuseJS is the first framework to use cross-browser **[sandboxed natives][1]**. This allows the extension of `Array`, `String`, `Number`, `Date`, and `RegExp` core objects, without polluting the native objects of the host environment.

FuseJS emphasizes browser capability testing, method forking, and lazy method definition for maintainability and performance. Modules and adapters are designed to allow customized builds, including one of seven supported CSS selector engines<sup><a name="fnref1" href="#fn1">1</a></sup>. FuseJS also follows ECMA 2.62 (*5th edition*) specifications, supports minification, and plans to add inline documentation.

Additionally, FuseJS will feature framework emulation<sup><a name="fnref2" href="#fn2">2</a></sup> by creating a shell of the target framework and mapping all API calls to the FuseJS core. As support for more frameworks is added, the code base will gain numerous bug fixes and features, which, in turn, will be shared among all emulated frameworks. Because the FuseJS core is highly optimized, each emulated framework should, holistically, perform better than its official counterpart. The implications are manifold: developers could simply replace a supported client-side framework with `FuseJS + Emulation Layer` and receive instant performance and stability gains, while continuing to use their familiar framework's API.

## Tested Browsers

- Microsoft [Internet Explorer][2] for Windows, 6.0 and higher
- Mozilla [Firefox][3] 1.5 and higher
- Google [Chrome][4] 1.0 and higher
- Apple [Safari][5] 2.0.0 and higher
- [Opera][6] 9.25 and higher
- [Konqueror][7] 4.2.2 and higher
- [SeaMonkey][8] 1.0 and higher

## Getting and Building FuseJS

The FuseJS source code is hosted on [GitHub][9]. Check out a working copy of the source tree with [Git][10]:

        $ git clone git://github.com/jdalton/fusejs.git
        $ cd fusejs
        $ git submodule update --init

To build FuseJS, you'll need [Ruby][11] 1.8.2 or higher. From the repo's root directory, run `ruby Build.rb` to automatically concatenate the source files, generate the composite in `dist/fuse.js`, and build the legacy unit tests in `test/unit/legacy/build/`.

Once you fork FuseJS on GitHub and commit your changes, you may also [send a pull request][12] if you'd like your feature or bug fix to be considered for the next release.

Please make sure to update all unit tests in the `test/` directory as well.

## Community

- Discuss all things FuseJS in the [#fusejs IRC channel][13] on irc.freenode.net.

- Use the [FuseJS issue tracker][14] to report a bug or share an awesome enhancement. Before posting, please read the Lighthouse [text formatting guide][15]. Additionally, Lighthouse lacks the GUI to edit comments; however, you may install [this Greasemonkey script][16] or use [this bookmarklet][17] to insert the missing `edit` links.

## Gotchas

- Firefox 3.6 changed the default value for `security.fileuri.strict_origin_policy` (in `about:config`) to `true`. **You may need to change this value** to `false` to run the unit tests locally.

- If `$ git submodule update --init` fails, try deleting the contents of the `vendor` folder and running the command again.

## Footnotes

1. The following CSS selector engines are supported<a name="fn1" title="Jump back to footnote 1 in the text." href="#fnref1">&#8617;</a>: [NWMatcher][18] *(default)*, [Acme][19] *(Dojo)*, [DomQuery][20] *(ExtJS)*, [Sizzle][21] *(jQuery)*, [Peppy][22], [Slick][23] *(MooTools)*, and [Sly][24].
  
2. [Prototype][25] emulation will be supported in the beta version<a name="fn2" title="Jump back to footnote 2 in the text." href="#fnref2">&#8617;</a>.


  [1]: http://github.com/jdalton/fusebox#readme
  [2]: http://www.microsoft.com/windows/internet-explorer
  [3]: http://www.mozilla.com/firefox
  [4]: http://www.google.com/chrome
  [5]: http://www.apple.com/safari
  [6]: http://www.opera.com
  [7]: http://www.konqueror.org
  [8]: http://www.seamonkey-project.org/
  [9]: http://github.com
  [10]: http://git-scm.com
  [11]: http://www.ruby-lang.org
  [12]: http://github.com/guides/pull-requests
  [13]: irc://irc.freenode.net/#fusejs
  [14]: https://fusejs.lighthouseapp.com/projects/24813-fusejs/tickets?q=all
  [15]: http://help.lighthouseapp.com/faqs/getting-started/how-do-i-format-text
  [16]: http://userscripts.org/scripts/show/63702
  [17]: http://gist.github.com/251306
  [18]: http://github.com/dperini/nwmatcher
  [19]: http://svn.dojotoolkit.org/src/dojo/trunk/_base/query.js
  [20]: http://www.extjs.com/deploy/ext/docs/source/DomQuery.html#cls-Ext.DomQuery
  [21]: http://sizzlejs.com/
  [22]: http://jamesdonaghue.com/static/peppy
  [23]: http://github.com/subtleGradient/slick
  [24]: http://github.com/digitarald/sly
  [25]: http://prototypejs.org
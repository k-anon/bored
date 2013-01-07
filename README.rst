====================================================
Booru-On-Rails Extension for Derpibooru (B.O.R.E.D.)
====================================================

About
-----

The Booru-On-Rails Extension is a userscript project to provide various useful
additions and tweaks to the `Derpibooru <http://www.derpiboo.ru/>`__ linear
imageboard ("booru") dedicated to the fine pieces of art associated with
*My Little Pony: Friendship is Magic.* As a userscript, its features may be
useful to regulars but are often outside the scope of the original board (and
are likely to be implemented in Derpibooru proper otherwise.)

The current "stable" version is **0.2.6.** Users are recommended to acquire the
`release from Userscripts <http://userscripts.org/users/47082>`__. It is there
you will also find the up-to-date features list. For power users interested in
the "bleeding-edge," the ``develop`` branch is intended for the latest
non-deployed snapshot of code, although deployment is expected to be often.

Contributing
------------

The original author is K_A, who is now a moderator and has access to the actual
site code. BigMax of
`Ponibooru Board Helper <http://userscripts.org/scripts/show/129648>`__ fame has
recently volunteered as a collaborator, and interested parties are invited to
fork, make or improve features, and submit pull requests. Contributors will be
credited in kind in Userscripts and in a ``CONTRIBUTORS`` text.

B.O.R.E.D. makes use of a hosted copy
of `markItUp <http://markitup.jaysalvat.com/home/>`__ and of the 
`jQuery <http://www.jquery.com/>`__ object already available in the site's
pages.

Coding Style
~~~~~~~~~~~~

Please contribute code taking advantage of jQuery and fairly compliant with
`JSLint <www.jslint.com/>`__ standards. New commits to ``master`` correspond to
the next version release. Topic branches are encouraged and will generally be
merged into a ``develop`` branch, with the exception of "hot" fixes. Release
branches, however, will likely not happen outside of large releases and beta
testing.

The motivation for implementing part of the
`git-flow model <http://nvie.com/posts/a-successful-git-branching-model/>`__
is to future-proof the management of incoming code contributions.

All externally hosted scripts are mirrored in the ``hosted/`` directory.

Adding Features
~~~~~~~~~~~~~~~

If adding a new feature to B.O.R.E.D., you must add a key for it in
``BOREDConfig`` at the top of ``BOREDInit``. Further, you may want to add it to
the global configuration panel. To do this, modify ``BOREDConfig.PANEL`` with
the key matching that of the option and the value being the field label. As
of now, all options are presumed Boolean since options beyond on/off were not
necessarily, but in the event of more interactive widgets, a widget name or
ECMAScript type will be needed in the ``BOREDConfig.PANEL`` object and the
widget itself described alongside ``BOREDConfig.BooleanWidget``.

From there, the general pattern is to check the respective options and page
prerequisites (involved elements, etc.) and then to call (or initialize) a
function. This takes place in the monolithic ``BOREDInit`` function merely to
simplify adding it inline to the page for quick loading and taking advantage
of jQuery.

License
-------

You may copy, edit, and reuse this code to your liking. Credit is appreciated
but not mandated. This license is often known as the
`WTFPL <http://sam.zoy.org/wtfpl/>`__. See ``LICENSE``.

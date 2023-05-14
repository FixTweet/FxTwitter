FixTweet
===================================

.. toctree::
   :maxdepth: 2
   :caption: 📓 User Guide
   :hidden:

   user/why
   user/platforms

.. toctree::
   :maxdepth: 2
   :caption: 🧑‍💻 API Reference
   :hidden:

   api/index

.. toctree::
   :maxdepth: 2
   :caption: 🚀 Deployment Guide
   :hidden:

   deploy/why
   deploy/architecture
   deploy/index

.. note::

   This documentation is a work in progress and will be incomplete as it is currently under development. Please check the main GitHub page for more information about FixTweet.

What is FixTweet?
-----------------

FixTweet (fxtwitter.com) supercharges your Twitter embeds on platforms like Discord and Telegram, letting Tweets with **videos**, **polls**, **multiple images**, and more display properly even where they otherwise wouldn't.

How can I use it?
-----------------

Just add **fx** before your Tweet URL. https&nbsp;://**twitter**.com/user/status/XXX becomes https&nbsp;://**fxtwitter**.com/user/status/XXX.

We also have another domain **twittpr.com** that you can use if you prefer easy sed replacement on Discord. Send a Tweet, then send `s/e/p` afterwards and the domain will be changed.

Why should I use it?
-----------------

There are a lot of reasons why you might want to use FixTweet.

  - You want to embed videos
  - You want to embed polls
  - Telegram constantly has broken Twitter embeds
  - You're using Telegram and have a multi-image Tweet
  - You want to translate a Tweet to a different language for sharing

Is it open source? Can I run my own version of FixTweet?
-----------------

Yes! FixTweet is `open source <https://github.com/FixTweet/FixTweet>`_ and released under the MIT license.

As a result, you're free to make your own changes and run your own version of FixTweet. We also accept pull requests if you make changes to improve compatibility, add features, fix bugs, etc.

FixTweet is written in TypeScript and built for the Cloudflare Workers platform. This means you can host your own version of FixTweet completely free with **no server or Twitter API keys required**. Check out the `deployment guide <deploy/index>`_ for more information.

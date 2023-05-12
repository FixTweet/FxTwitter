Supported platforms
===================================

.. toctree::
   :maxdepth: 2

FixTweet generates embeds compliant with the following standards:

   * `OpenGraph`_
   * `Twitter Cards`_
   * `Oembed`_
   * Possible Future: Telegram Instant View

**TL;DR**, we comply with all these standards to achieve maximum compatibility with the broadest range of platforms possible. However, we only officially test against **Discord** and **Telegram** as those platforms are by far the most used platforms for generating embeds.

Many other platforms incorporate some of the same embed standards that FixTweet supports. However, these platforms vary widely in how many of these specifications they implement and how they present embeds to users. As such, we don't actively target other platforms. However, we are willing to `accept pull requests`_ that improve compatibility with other platforms.

Some platforms also have limitations, for instance:

   * Due to the way Discord video embeds work, the Tweet text length may be limited for longer Tweets, and quote tweet context is excluded. Telegram does not have this limitation.
   * Telegram's clients vary in terms of how much text is displayed. For instance, Telegram Desktop displays only 3 lines of text, while Telegram for iOS, Android, and Mac can display more. 
   * Telegram video embeds cannot exceed 20 MB. This can cause longer videos to break in Telegram. We are `investigating workarounds and fixes`_.


.. _OpenGraph: https://ogp.me/
.. _Twitter Card: https://developer.twitter.com/en/docs/tweets/optimize-with-cards/overview/abouts-cards.html
.. _Oembed: https://oembed.com/
.. _investigating workarounds and fixes: https://github.com/FixTweet/FixTweet/issues/39
.. _accept pull requests: https://github.com/FixTweet/FixTweet/pulls
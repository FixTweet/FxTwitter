Why use FixTweet?
===================================

Other than the reasons outlined on the homepage, FixTweet tries to offer the most features possible within the confines of our embeds. 

.. list-table::
   :header-rows: 1

   * - 
     - `FixTweet <https://github.com/FixTweet/FixTweet/commits>`_ 
     - `Twitter default`
     - `vxTwitter (BetterTwitFix) <https://github.com/dylanpdx/BetterTwitFix/commits>`_ 
     - `Twxtter (sixFix) <https://github.com/Twxtter/Twxtter-main/commits>`_
   * - Embed Tweets / Images
     - ✔️
     - ✔️
     - ✔️
     - ✔️
   * - Embed profile pictures on text Tweets
     - ✔️
     - ❌
     - ✔️
     - ✔️
   * - Embed Twitter Videos
     - ✔️
     - ➖ Discord Only¹
     - ✔️
     - ✔️
   * - Embed External Videos (YouTube, etc.)
     - ✔️⁵
     - ❌
     - ❌⁴
     - ❌
   * - Embed Poll results
     - ✔️
     - ❌
     - `✔️ <https://github.com/dylanpdx/BetterTwitFix/issues/17>`_
     - ❌
   * - Embed Quote Tweets
     - ✔️
     - ❌
     - ☑️ Without Media
     - ☑️ Without Media
   * - Embed Multiple Images
     - ✔️
     - ➖ Discord Only³
     - ✔️
     - ❌
   * - Translate Tweets
     - ✔️
     - ❌
     - ❌
     - ❌
   * - Publicly accessible embed index
     - ❌²
     - N/A
     - ❌²
     - ✔️
   * - Replace t.co with original links
     - ✔️
     - ❌
     - ❌
     - ❌
   * - Media-based embed colors on Discord
     - ✔️
     - ❌
     - ❌
     - ❌
   * - Redirect to media file (without embed)
     - ✔️
     - ❌
     - ☑️ Subdomain broken, no images
     - ☑️ No images
   * - Strip Twitter tracking info on redirect
     - ✔️
     - ❌
     - ✔️
     - ✔️
   * - Show retweet, like, reply, view counts
     - ✔️
     - ➖ Discord Only, no views³
     - ☑️ No replies or views
     - ☑️ No replies or views
   * - Discord sed replace (`s/`) friendly
     - ☑️ twittpr.com
     - N/A
     - ❌
     - ✔️
   * - Tweet fetch API for Developers
     - ✔️
     - N/A
     - ❌
     - ✔️
   * - DDoS protection & low latency globally
     - ✔️
     - N/A
     - ❌
     - ❌
   * - Last commit 
     - |fc|
     - N/A
     - |vc|
     - |sc|


.. |fc| image:: https://img.shields.io/github/last-commit/FixTweet/FixTweet?label
.. |vc| image:: https://img.shields.io/github/last-commit/dylanpdx/BetterTwitFix?label
.. |sc| image:: https://img.shields.io/github/last-commit/Twxtter/Twxtter-main?label

¹ Discord will attempt to embed Twitter's video player, but it is unreliable and does not work on mobile

² Neither FixTweet or vxTwitter have a public embed ledger, for privacy reasons. vxTwitter still stores all responses in a database / JSON file controlled by the owner. FixTweet by contrast relies on Cloudflare caching of responses: there is no link store accessible to the owner.

³ Discord uses a custom embed container for Twitter.com to enable multi-image, which is unfortunately not available to other websites.

⁴ On GitHub, BetterTwitFix (vxTwitter) claims to support this feature, however in my testing as of mid-July 2022, this does not seem to work.

⁵ External media requiring web containers, such as YouTube, won't embed in Telegram because Telegram doesn't support it. Plain media will work in Telegram, and it works either way inside Discord.
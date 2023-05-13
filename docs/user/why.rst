Why use FixTweet?
===================================

Other than the reasons outlined on the homepage, FixTweet tries to offer the most features possible within the confines of our embeds. 

+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
|                                         |        FixTweet         |       Twitter default       |         vxTwitter (BetterTwitFix)                 |           Twxtter (sixFix)           |
+=======================================+=========================+=============================+===================================================+=====================================+
| Embed Tweets / Images                   |       :heavy_check_mark:        |      :heavy_check_mark:       |                :heavy_check_mark:                 |          :heavy_check_mark:          |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Embed profile pictures on text Tweets   |       :heavy_check_mark:        |             :x:               |                :heavy_check_mark:                 |          :heavy_check_mark:          |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Embed Twitter Videos                    |       :heavy_check_mark:        | :heavy_minus_sign: Discord Only¹ |                :heavy_check_mark:                 |          :heavy_check_mark:          |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Embed External Videos (YouTube, etc.)   |       :heavy_check_mark:⁵       |             :x:               |                       :x:⁴                        |                 :x:                  |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Embed Poll results                      |       :heavy_check_mark:        |             :x:               |            [:heavy_check_mark:][polladd]            |                 :x:                  |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Embed Quote Tweets                      |       :heavy_check_mark:        |             :x:               |        :ballot_box_with_check: Without Media        | :ballot_box_with_check: Without Media|
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Embed Multiple Images                   |       :heavy_check_mark:        | :heavy_minus_sign: Discord Only³ |                :heavy_check_mark:                 |                 :x:                  |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Translate Tweets                        |       :heavy_check_mark:        |             :x:               |                       :x:                         |                 :x:                  |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Publicly accessible embed index         |             :x:²            |             N/A               |                       :x:²                        |          :heavy_check_mark:          |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Replace t.co with original links        |       :heavy_check_mark:        |             :x:               |                       :x:                         |                 :x:                  |
+---------------------------------------+---------------------------+-----------------------------+---------------------------------------------------+-------------------------------------+
| Media-based embed colors on Discord     |   :heavy_check_mark:    |             :x:               |                        :x:                          |                :x:                   |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+
| Redirect to media file (without embed)  |   :heavy_check_mark:    |             :x:               | :ballot_box_with_check: Subdomain broken, no images |    :ballot_box_with_check: No images |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+
| Strip Twitter tracking info on redirect |   :heavy_check_mark:    |             :x:               |                :heavy_check_mark:                   |           :heavy_check_mark:          |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+
| Show retweet, like, reply counts        |   :heavy_check_mark:    | :heavy_minus_sign: Discord Only³ |        :ballot_box_with_check: No replies         |   :ballot_box_with_check: No replies  |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+
| Discord sed replace (`s/`) friendly     | :ballot_box_with_check: twittpr.com |             N/A               |                        :x:                          |           :heavy_check_mark:          |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+
| Tweet fetch API for Developers          |   :heavy_check_mark:    |             N/A               |                        :x:                          |           :heavy_check_mark:          |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+
| DDoS protection & low latency globally  |   :heavy_check_mark:    |             N/A               |                        :x:                          |                :x:                   |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+
| Last commit                             | .. image:: https://img.shields.io/github/last-commit/FixTweet/FixTweet?label  |             N/A               | .. image:: https://img.shields.io/github/last-commit/dylanpdx/BetterTwitFix?label | .. image:: https://img.shields.io/github/last-commit/Twxtter/Twxtter-main?label |
+-----------------------------------------+-------------------------+-------------------------------+----------------------------------------------------+--------------------------------------+

¹ Discord will attempt to embed Twitter's video player, but it is unreliable and does not work on mobile

² Neither FixTweet or vxTwitter have a public embed ledger, for privacy reasons. vxTwitter still stores all responses in a database / JSON file controlled by the owner. FixTweet by contrast relies on Cloudflare caching of responses: there is no link store accessible to the owner.

³ Discord uses a custom embed container for Twitter.com to enable multi-image, which is unfortunately not available to other websites.

⁴ On GitHub, BetterTwitFix (vxTwitter) claims to support this feature, however in my testing as of mid-July 2022, this does not seem to work.

⁵ External media requiring web containers, such as YouTube, won't embed in Telegram because Telegram doesn't support it. Plain media will work in Telegram, and it works either way inside Discord.
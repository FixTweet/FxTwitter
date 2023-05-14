Tweet (Status) Fetch API
================

This is the main FixTweet API. It provides anyone access to the same exact data we use to generate FixTweet embeds for users, but in an easy-to-digest format for working with your existing scripts. It includes information based on Twitter APIs, including some data not accessible using Twitter's public API. Furthermore, unlike Twitter you don't need an API key, and there are no strict rate limits (but please be nice!)

.. note:: This documentation has been converted from the GitHub Wiki version and may contain formatting errors

All options appended with ``?`` are optional.

Status API Endpoint
-------------------

``https://api.fxtwitter.com/:screen_name?/status/:id/:translate_to?``

- ``screen_name`` - The screen name (@ handle) of the tweet, which is ignored
- ``id`` - The ID of the status (tweet)
- ``translate_to?`` - 2 letter ISO language code of the language you want to translate the tweet into

Returns a JSON object. Here is a sample:

.. code-block:: json

    {
        "code": 200,
        "message": "OK",
        "tweet": {
            "url": "https://twitter.com/Twitter/status/1580661436132757506",
            "id": "1580661436132757506",
            "text": "a hit Tweet",
            "author": {
                "id": "783214",
                "name": "Twitter",
                "screen_name": "Twitter",
                "avatar_url": "https://pbs.twimg.com/profile_images/1488548719062654976/u6qfBBkF_200x200.jpg",
                "avatar_color": "#10A3FF",
                "banner_url": "https://pbs.twimg.com/profile_banners/783214/1646075315"
            },
            "replies": 4675,
            "retweets": 2422,
            "likes": 43852,
            "color": "#717577",
            "twitter_card": "summary_large_image",
            "created_at": "Thu Oct 13 20:47:08 +0000 2022",
            "created_timestamp": 1665694028,
            "possibly_sensitive": false,
            "views": null,
            "lang": "en",
            "replying_to": null,
            "replying_to_status": null,
            "media": {
                "photos": [{
                    "type": "photo",
                    "url": "https://pbs.twimg.com/media/Fe-jMcGWQAAFWoG.jpg",
                    "width": 118,
                    "height": 122,
                    "altText": "a heart that represents the Twitter like button with ten likes"
                }]
            },
            "source": "Twitter for iPhone"
        }
    }

Code will normally return 200 (message: ``OK``), but can return 401 (message ``PRIVATE_TWEET``), 404 (message ``NOT_FOUND``), or 500 (message ``API_FAIL``)

APITweet
--------

The container of all the information for a Tweet

Core attributes
^^^^^^^^^^^^^^^

- ``id`` string - Status (Tweet) ID
- ``url`` string - Link to original Tweet
- ``text`` string - Text of Tweet
- ``created_at`` string - Date/Time in UTC when the Tweet was created
- ``created_timestamp`` number - Seconds since UNIX epoch of when Tweet was created 
- ``color`` string - Dominant color pulled from either Tweet media or from the author's profile picture.
- ``lang`` string | null - Language that Twitter detects a Tweet is. May be null is unknown.
- ``replying_to`` string | null - Screen name of person being replied to, or null
- ``replying_to_status`` string | null - Tweet ID snowflake being replied to, or null
- ``twitter_card`` (``'tweet'`` | ``'summary'`` | ``'summary_large_image'`` | ``'player'``) - Corresponds to proper embed container for Tweet, which is used by FixTweet for our official embeds. 
- ``author`` `APIAuthor`_ - Author of the tweet
- ``source`` string - Tweet source (i.e. Twitter for iPhone)

Interaction counts
^^^^^^^^^^^^^^^^^^

- ``likes`` number - Like count
- ``retweets`` number - Retweet count
- ``replies`` number - Reply count
- ``views`` number | null - View count, returns null if view count is not available (i.e. older Tweets)

Embeds
^^^^^^

- ``quote``? `APITweet`_ - Nested Tweet corresponding to the tweet which this tweet is quoting, if applicable
- ``poll``? `APIPoll`_ - Poll attached to Tweet
- ``translation``? `APITranslate`_ - Translation results, only provided if explicitly asked

.. code-block:: none

    media? { - Containing object containing references to photos, videos, or external media
        external? APIExternalMedia - Refers to external media, such as YouTube embeds
        photos? APIPhoto[] - An Array of photos from a Tweet
        videos? APIVideo[] - An Array of videos from a Tweet
        mosaic? APIMosaicPhoto - Corresponding Mosaic information for a Tweet
    }

APIAuthor
---------

Information about the author of a tweet

- ``name`` string - Name of the user, set on their profile
- ``screen_name`` string - Screen name or @ handle of the user.
- ``avatar_url?`` string - URL for the user's avatar (profile picture)
- ``avatar_color?`` string - Palette color corresponding to the user's avatar (profile picture). Value is a hex, including ``#``.
- ``banner_url?`` string - URL for the banner of the user

APITranslate
------------

Information about a requested translation for a Tweet, when asked.

- ``text`` string - Translated Tweet text
- ``source_lang`` string - 2-letter ISO language code of source language
- ``target_lang`` string - 2-letter ISO language code of target language

APIExternalMedia
----------------

Data for external media, currently only video.

- ``type`` string - Embed type, currently always ``video``
- ``url`` string - Video URL
- ``height`` number - Video height in pixels
- ``width`` number - Video width in pixels
- ``duration`` number - Video duration in seconds

APIPoll
-------

Data for a poll on a given Tweet

- ``choices`` `APIPollChoice`_[] - Array of the poll choices
- ``total_votes`` number - Total votes in poll
- ``ends_at`` string - Date of which the poll ends
- ``time_left_en`` string - Time remaining counter in English (i.e. **9 hours left**)

APIPollChoice
-------------

Data for a single choice in a poll

- ``label`` string - What this choice in the poll is called
- ``count`` number - How many people voted in this poll
- ``percentage`` number - Percentage of total people who voted for this option (0 - 100, rounded to nearest tenth)

APIPhoto
--------

Data for a single photo in a Tweet

- ``type`` 'photo' - This can help compare items in a pool of media
- ``url`` string - URL of the photo
- ``width`` number - Width of the photo, in pixels
- ``height`` number - Height of the photo, in pixels

APIMosaicPhoto
--------------

Data for the mosaic service, which stitches photos together

- ``type`` 'mosaic_photo' - This can help compare items in a pool of media
- ``width`` number - Width of the photo, in pixels
- ``height`` number - Height of the photo, in pixels

.. code-block:: none

    formats { - Pool of formats, only jpeg and webp are returned currently
        webp string - URL for webp resource
        jpeg string - URL for jpeg resource
    }

APIVideo
--------

Data for a Tweet's video

- ``type`` 'video' | 'gif' - Returns video if video, or gif if gif. Note that on Twitter, all GIFs are MP4s.
- ``url`` string - URL corresponding to the video file
- ``thumbnail_url`` string - URL corresponding to the thumbnail for the video
- ``width`` number - Width of the video, in pixels
- ``height`` number - Height of the video, in pixels
- ``format`` string - Video format, usually ``video/mp4``

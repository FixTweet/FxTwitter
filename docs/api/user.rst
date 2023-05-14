User Fetch API
==============

This API provides access to user-specific data from FixTweet. It includes user-related information such as profile details, number of followers and tweets, etc.

.. note:: This API was just added. While it is mostly stable, it may be subject to change without notice

User API Endpoint
-----------------

`https://api.fxtwitter.com/:screen_name`

`screen_name` - The screen name (@ handle) of the user.

Returns a JSON object. Here is a sample:

.. code-block:: json

    {
        "code": 200,
        "message": "OK",
        "user": {
            "url": "https://twitter.com/Twitter",
            "id": "783214",
            "followers": 65704781,
            "following": 0,
            "likes": 6130,
            "tweets": 15051,
            "name": "Twitter",
            "screen_name": "Twitter",
            "description": "What's happening?!",
            "location": "everywhere",
            "avatar_url": "https://pbs.twimg.com/profile_images/1488548719062654976/u6qfBBkF_normal.jpg",
            "joined": "Tue Feb 20 14:35:54 +0000 2007",
            "birthday": {
                "day": 21,
                "month": 3
            }
        }
    }

Code will normally return 200 (message: ``OK``), but can return 401 (message ``PRIVATE_TWEET``), 404 (message ``NOT_FOUND``), or 500 (message ``API_FAIL``)

APIUser
-------

The container of all the information for a User

- ``id`` string - User ID
- ``name`` string - Name of the user, set on their profile
- ``screen_name`` string - Screen name or @ handle of the user.
- ``avatar_url?`` string - URL for the user's avatar (profile picture)
- ``banner_url?`` string - URL for the banner of the user
- ``description`` string - User's profile description
- ``location`` string - User's location as set on their profile
- ``url`` string - URL provided in the user's profile
- ``protected`` boolean - Indicates whether the user's tweets are protected
- ``followers`` number - Number of followers the user has
- ``following`` number - Number of other users this user is following
- ``tweets`` number - Number of tweets (including retweets) issued by the user
- ``likes`` number - Number of tweets this user has liked
- ``joined`` string - The date when the user joined Twitter
- ``birthday`` object - User's birthday. Can include ``day``, ``month``, and ``year``. These are all considered optional due to different birthday privacy settings, except ``day`` and ``month`` will both be present if one is.

UserAPIResponse
---------------

Response from the User Fetch API

- ``code`` number - HTTP response code
- ``message`` string - A message accompanying the response code
- ``user?`` [APIUser](#apiuser) - User details, if response is ``OK``

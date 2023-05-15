About FixTweet API
================

We provide a free API that lets you fetch users and statuses (tweets) from Twitter without dealing with API keys or giving Elon Musk money.

This allows you to add easy read-only access Twitter into your own application.

Currently, we have 2 endpoints available, the `Status (Tweet) Fetch <api/status>`_ and `User Fetch <api/user>`_. Both are accessible by replacing a ``twitter.com`` URL with an ``api.fxtwitter.com`` URL, same formatting rules apply as FixTweet embed links.

All responses are returned in JSON format.

We don't set strict limits on how many times you can call the API. However, we ask that you please don't abuse it. We do monitor if a large amount of requests come from a single IP or user agent, and if you have persistent high usage of the API we may restrict you from using it.

If you have an interest in using FixTweet to build a project that requires bulk access to the Twitter API, we recommend `deploying your own instance <deploy/index>`_ of FixTweet. **Deploying FixTweet yourself is free with 100K requests per day with Cloudflare Workers and does not require Twitter API keys.**
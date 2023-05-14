Architecture
===================================

Components
-----------------------

There are three main components to FixTweet:
  - `FixTweet <https://github.com/FixTweet/FixTweet>`_
  - `Mosaic <https://github.com/FixTweet/mosaic>`_
  - `Elongator <https://github.com/FixTweet/elongator>`_

FixTweet
-----------------------

FixTweet is built on the `Cloudflare Workers`_ serverless platform and written in `TypeScript`_. It's built using `Webpack`_, and internally uses `itty-router`_ to route requests and `toucan-js`_ as its `Sentry`_ SDK.

.. _Cloudflare Workers: https://workers.cloudflare.com/
.. _TypeScript: https://www.typescriptlang.org/
.. _Webpack: https://webpack.js.org/
.. _itty-router: https://github.com/kwhitley/itty-router
.. _toucan-js: https://github.com/robertcepa/toucan-js
.. _Sentry: https://sentry.io/

Mosaic
-----------------------

Mosaic is FixTweet's multi-image combining service, which is essential to embedding multi-image Tweets. It is written in `Rust <https://www.rust-lang.org/>`_ and is the one component that does run on a server because the image combining is *much* more computationally intensive and *it needs to be fast*. Cloudflare Workers simply cannot provide the same performance for this use case, thus erasing any performance gains from its latency advantage in this case.

It has very basic usage, it doesn't interact with Twitter's API at all or even FixTweet. FixTweet generates a ``mosaic.fxtwitter.com`` URL directly with the Twitter image IDs. The client doing embedding fetches the URL from Mosaic which downloads the images directly from Twitter's CDN and combines into a single image. Mosaic does not actually cache images itself, instead it relies on Cloudflare's CDN to do so, and it has a long TTL to keep repeat accesses in the same region fast.

Mosaic is an optional component of FixTweet. It can be disabled by removing or blanking ``MOSAIC_DOMAIN_LIST``, and only the first image will be returned by default. You're free to use our public mosaic domain (``mosaic.fxtwitter.com``) with your own instance of FixTweet as long as you are not being abusive.

Elongator
-----------------------

Elongator is the newest optional component of FixTweet. It is implemented as a `Cloudflare Workers service binding <https://developers.cloudflare.com/workers/platform/bindings/about-service-bindings/>`_. This service helps FixTweet fetch Tweets containing NSFW media.

In 2023, Twitter began censoring Tweets with NSFW media from our Tweet fetch method. Elongator was quickly whipped up as a solution to this problem. It's proven itself as an effective workaround to the problem, but it is still somewhat basic and even *experimental*.

This solution relies on an army of empty Twitter accounts in order to function. FixTweet tries fetching the Tweet normally, and if the Tweet exists but does not return, it will call elongator. Elongator "staples" the Twitter auth token to the existing request to let it succeed.

This has a lot of caveats. For one, accounts can sometimes get locked for automated behavior. Having enough accounts is crucial to this, as if an account is broken it will try different ones until it works.

Obviously, this is not the best solution in the world, but it's practically essential to running FixTweet at the scale that it does without forking over cash money for the Twitter API.

If we find a better solution, elongator will likely go away. But for now, this is what we have.

How FixTweet works
-----------------------

An HTTP request comes in and is sorted out by the router. When a Tweet is being accessed, it sniffs the user agent to determine if the request came from a bot or another automated agent.

If it looks like a human request (and it's not an API request or direct media), it's immediately redirected where it needs to be instead of constructing an embed.

If it looks like a bot request, an embed will be constructed.

Guest token fetch
-----------------------

We rely on Twitter's guest token API in order to fetch Tweets. This is also used by other utilities such as ``youtube-dl`` to download Twitter videos as it lets you access the Twitter API without an API key.

This approach has a number of benefits. We have practically no rate limits (when not using elongator) as tokens can be regenerated if a rate limit is hit on a particular edge.

In order to use this API, we first call ``/1.1/guest/activate.json`` to retrieve a guest token. As this additional request adds latency, we cache the guest token on the Cloudflare edge.

For the requests themselves, we use a mix of Twitter API v2 REST (for Tweets) and GraphQL (for Users). We may rework the Tweet fetching logic to use GraphQL in the future, as the GraphQL endpoints contain features not available on REST.
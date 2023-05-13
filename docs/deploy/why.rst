Why deploy FixTweet?
===================================

.. toctree::
   :maxdepth: 2

There are a few reasons why you might want to deploy FixTweet:
  * You want to run your own private instance of FixTweet (simple enough)
  * You want free Twitter API access without paying Elon Musk money
  * You want to modify FixTweet to add your own custom features

How to deploy FixTweet:
-----------------------


  1. Clone the repository and install `Node.js <https://nodejs.org/>`_.

  2. Run ``npm install`` in the repository directory.

  3. Copy ``wrangler.example.toml`` to ``wrangler.toml`` and add your `Cloudflare account ID <https://developers.cloudflare.com/fundamentals/get-started/basic-tasks/find-account-and-zone-ids/>`_. Modify the worker's name if necessary.

  4. Also, copy ``.env.example`` to ``.env`` and modify HOST_URL, DIRECT_MEDIA_DOMAINS to match your domain and perform any other necessary changes.

  5. Authenticate with Cloudflare using ``npx wrangler login``.

  6. Publish your worker with ``npx wrangler publish`` (or ``npm run publish``).

  If you have more questions about setting up Cloudflare Workers, refer to their `Getting Started guide <https://developers.cloudflare.com/workers/get-started/guide/>`_.

  7. After setting up your worker on ``*.workers.dev``, `add your worker to your custom domain <https://developers.cloudflare.com/workers/platform/routing/custom-domains/>`_.

  8. If you want to use Sentry in your product to catch exceptions, populate Sentry details in your ``.env`` file.

  9. Set up elongator, see below.

Potential Pitfalls
-----------------------

In 2023, Twitter started blocking tweets with NSFW media from the guest API. To overcome this, FixTweet uses a service binding called `elongator <https://github.com/FixTweet/elongator>`_, which utilizes empty Twitter accounts to successfully make these requests. However, this is optional and only necessary for those planning to support embedding NSFW media. This method means you can bypass Twitter's official API and avoid any associated costs.
Please ensure you modify the URLs to match your actual repository and hosting details.

.. _Node.js: https://nodejs.org/
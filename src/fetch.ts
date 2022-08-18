import { Constants } from './constants';

export const fetchUsingGuest = async (
  status: string,
  event: FetchEvent
): Promise<TimelineBlobPartial> => {
  let apiAttempts = 0;
  let newTokenGenerated = false;

  const tokenHeaders: { [header: string]: string } = {
    Authorization: Constants.GUEST_BEARER_TOKEN,
    ...Constants.BASE_HEADERS
  };

  const guestTokenRequest = new Request(
    `${Constants.TWITTER_API_ROOT}/1.1/guest/activate.json`,
    {
      method: 'POST',
      headers: tokenHeaders,
      cf: {
        cacheEverything: true,
        cacheTtl: Constants.GUEST_TOKEN_MAX_AGE
      },
      body: ''
    }
  );

  /* A dummy version of the request only used for Cloudflare caching purposes.
     The reason it exists at all is because Cloudflare won't cache POST requests. */
  const guestTokenRequestCacheDummy = new Request(
    `${Constants.TWITTER_API_ROOT}/1.1/guest/activate.json`,
    {
      method: 'GET',
      cf: {
        cacheEverything: true,
        cacheTtl: Constants.GUEST_TOKEN_MAX_AGE
      }
    }
  );

  const cache = caches.default;

  while (apiAttempts < 10) {
    const csrfToken = crypto
      .randomUUID()
      .replace(
        /-/g,
        ''
      ); /* Generate a random CSRF token, this doesn't matter, Twitter just cares that header and cookie match */

    const headers: { [header: string]: string } = {
      Authorization: Constants.GUEST_BEARER_TOKEN,
      ...Constants.BASE_HEADERS
    };

    apiAttempts++;

    let activate: Response | null = null;

    if (!newTokenGenerated) {
      const cachedResponse = await cache.match(guestTokenRequestCacheDummy);

      if (cachedResponse) {
        console.log('Token cache hit');
        activate = cachedResponse;
      } else {
        console.log('Token cache miss');
        newTokenGenerated = true;
      }
    }

    if (newTokenGenerated || activate === null) {
      /* If all goes according to plan, we have a guest token we can use to call API
        AFAIK there is no limit to how many guest tokens you can request.

        This can effectively mean virtually unlimited (read) access to Twitter's API,
        which is very funny. */
      activate = await fetch(guestTokenRequest);
    }

    /* Let's grab that guest_token so we can use it */
    let activateJson: { guest_token: string };

    try {
      activateJson = (await activate.clone().json()) as { guest_token: string };
    } catch (e: unknown) {
      continue;
    }

    const guestToken = activateJson.guest_token;

    console.log(newTokenGenerated ? 'Activated guest:' : 'Using guest:', activateJson);
    console.log('Guest token:', guestToken);

    /* Just some cookies to mimick what the Twitter Web App would send */
    headers['Cookie'] = [
      `guest_id_ads=v1%3A${guestToken}`,
      `guest_id_marketing=v1%3A${guestToken}`,
      `guest_id=v1%3A${guestToken}`,
      `ct0=${csrfToken};`
    ].join('; ');

    headers['x-csrf-token'] = csrfToken;
    headers['x-twitter-active-user'] = 'yes';
    headers['x-guest-token'] = guestToken;

    /* We pretend to be the Twitter Web App as closely as possible,
      so we use twitter.com/i/api/2 instead of api.twitter.com/2.
      We probably don't have to do this at all. But hey, better to be consistent with Twitter Web App. */
    let conversation: TimelineBlobPartial;
    let apiRequest;

    try {
      apiRequest = await fetch(
        `${Constants.TWITTER_ROOT}/i/api/2/timeline/conversation/${status}.json?${Constants.GUEST_FETCH_PARAMETERS}`,
        {
          method: 'GET',
          headers: headers
        }
      );
      conversation = await apiRequest.json();
    } catch (e: unknown) {
      /* We'll usually only hit this if we get an invalid response from Twitter.
         It's uncommon, but it happens */
      console.error('Unknown error while fetching conversation from API');
      event && event.waitUntil(cache.delete(guestTokenRequestCacheDummy.clone()));
      newTokenGenerated = true;
      continue;
    }

    const remainingRateLimit = parseInt(
      apiRequest.headers.get('x-rate-limit-remaining') || '0'
    );
    console.log(`Remaining rate limit: ${remainingRateLimit} requests`);
    /* Running out of requests within our rate limit, let's purge the cache */
    if (remainingRateLimit < 20) {
      console.log(`Purging token on this edge due to low rate limit remaining`);
      event && event.waitUntil(cache.delete(guestTokenRequestCacheDummy.clone()));
    }

    if (
      typeof conversation.globalObjects === 'undefined' &&
      (typeof conversation.errors === 'undefined' ||
        conversation.errors?.[0]?.code ===
          239) /* TODO: i forgot what code 239 actually is lol */
    ) {
      console.log('Failed to fetch conversation, got', conversation);
      newTokenGenerated = true;
      continue;
    }
    /* If we've generated a new token, we'll cache it */
    if (event && newTokenGenerated) {
      const cachingResponse = new Response(await activate.clone().text(), {
        headers: {
          ...tokenHeaders,
          'cache-control': `max-age=${Constants.GUEST_TOKEN_MAX_AGE}`
        }
      });
      console.log('Caching guest token');
      event.waitUntil(cache.put(guestTokenRequestCacheDummy, cachingResponse));
    }
    conversation.guestToken = guestToken;
    return conversation;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - This is only returned if we completely failed to fetch the conversation
  return {};
};

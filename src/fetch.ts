import { Context } from 'hono';
import { Constants } from './constants';
import { Experiment, experimentCheck } from './experiments';
import { generateUserAgent } from './helpers/useragent';

const API_ATTEMPTS = 3;
let wasElongatorDisabled = false;

/* TODO: Figure out why TS globals were broken when not forcing globalThis */
declare const globalThis: {
  fetchCompletedTime: number;
};

const generateSnowflake = () => {
  const epoch = 1288834974657n; /* Twitter snowflake epoch */
  const timestamp = BigInt(Date.now()) - epoch;
  return String((timestamp << 22n) | BigInt(Math.floor(Math.random() * 696969)));
};

globalThis.fetchCompletedTime = 0;

export const twitterFetch = async (
  c: Context,
  url: string,
  useElongator = experimentCheck(
    Experiment.ELONGATOR_BY_DEFAULT,
    typeof c.env.TwitterProxy !== 'undefined'
  ),
  validateFunction: (response: unknown) => boolean,
  elongatorRequired = false
): Promise<unknown> => {
  let apiAttempts = 0;
  let newTokenGenerated = false;

  const [userAgent, secChUa] = generateUserAgent();
  console.log(`Outgoing useragent for this request:`, userAgent);

  const tokenHeaders: { [header: string]: string } = {
    'Authorization': Constants.GUEST_BEARER_TOKEN,
    'User-Agent': userAgent,
    'sec-ch-ua': secChUa,
    ...Constants.BASE_HEADERS
  };

  const guestTokenRequest = new Request(`${Constants.TWITTER_API_ROOT}/1.1/guest/activate.json`, {
    method: 'POST',
    headers: tokenHeaders,
    cf: {
      cacheEverything: true,
      cacheTtl: Constants.GUEST_TOKEN_MAX_AGE
    },
    body: ''
  });

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

  while (apiAttempts < API_ATTEMPTS) {
    /* Generate a random CSRF token, Twitter just cares that header and cookie match,
    REST can use shorter csrf tokens (32 bytes) but graphql prefers 160 bytes */
    const csrfToken = crypto.randomUUID().replace(/-/g, '');

    const headers: Record<string, string> = {
      Authorization: Constants.GUEST_BEARER_TOKEN,
      ...Constants.BASE_HEADERS
    };

    apiAttempts++;

    let activate: Response | null = null;

    if (!newTokenGenerated && !useElongator) {
      const timeBefore = performance.now();
      const cachedResponse = await cache.match(guestTokenRequestCacheDummy.clone());
      const timeAfter = performance.now();

      console.log(`Searched cache for token, took ${timeAfter - timeBefore}ms`);

      if (cachedResponse) {
        console.log('Token cache hit');
        activate = cachedResponse;
      } else {
        console.log('Token cache miss');
        newTokenGenerated = true;
      }
    }

    if (newTokenGenerated || (activate === null && !useElongator)) {
      /* Let's get a guest token to call the API.
      
      Back in the day (2022), this was pretty much unlimited and gave us nearly unlimited read-only access to Twitter.
      
      Since the Elon buyout, this has become more stringent with rate limits, NSFW tweets not loading with this method,
      among other seemingly arbitrary restrictions and quirks. */
      const timeBefore = performance.now();
      activate = await fetch(guestTokenRequest.clone());
      const timeAfter = performance.now();

      console.log(`Guest token request after ${timeAfter - timeBefore}ms`);
    }

    /* Let's grab that guest_token so we can use it */
    let activateJson: { guest_token: string };

    try {
      activateJson = (await activate?.clone().json()) as { guest_token: string };
    } catch (e: unknown) {
      continue;
    }

    /* Elongator doesn't need guestToken, so we just make up a snowflake */
    const guestToken = activateJson?.guest_token || generateSnowflake();

    console.log(newTokenGenerated ? 'Activated guest:' : 'Using guest:', activateJson);

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

    let response: unknown;
    let apiRequest;

    try {
      if (useElongator && typeof c.env.TwitterProxy !== 'undefined') {
        console.log('Fetching using elongator');
        const performanceStart = performance.now();
        apiRequest = await c.env.TwitterProxy.fetch(url, {
          method: 'GET',
          headers: headers
        });
        const performanceEnd = performance.now();
        console.log(`Elongator request successful after ${performanceEnd - performanceStart}ms`);
      } else {
        const performanceStart = performance.now();
        apiRequest = await fetch(url, {
          method: 'GET',
          headers: headers
        });
        const performanceEnd = performance.now();
        console.log(`Guest API request successful after ${performanceEnd - performanceStart}ms`);
      }

      response = await apiRequest?.json();
    } catch (e: unknown) {
      /* We'll usually only hit this if we get an invalid response from Twitter.
         It's uncommon, but it happens */
      console.error('Unknown error while fetching from API', e);
      /* Elongator returns strings to communicate downstream errors */
      if (String(e).indexOf('Status not found')) {
        console.log('Tweet was not found');
        return {};
      }
      !useElongator &&
        c.executionCtx &&
        c.executionCtx.waitUntil(
          cache.delete(guestTokenRequestCacheDummy.clone(), { ignoreMethod: true })
        );
      if (useElongator) {
        console.log('Elongator request failed, trying again without it');
        wasElongatorDisabled = true;
      }
      newTokenGenerated = true;
      useElongator = false;
      continue;
    }

    globalThis.fetchCompletedTime = performance.now();

    if (
      !wasElongatorDisabled &&
      !useElongator &&
      typeof c.env.TwitterProxy !== 'undefined' &&
      (response as TweetResultsByRestIdResult)?.data?.tweetResult?.result?.reason ===
        'NsfwLoggedOut'
    ) {
      console.log(`nsfw tweet detected, it's elongator time`);
      useElongator = true;
      continue;
    }

    const remainingRateLimit = parseInt(apiRequest.headers.get('x-rate-limit-remaining') || '0');
    console.log(`Remaining rate limit: ${remainingRateLimit} requests`);
    /* Running out of requests within our rate limit, let's purge the cache */
    if (!useElongator && remainingRateLimit < 10) {
      console.log(`Purging token on this edge due to low rate limit remaining`);
      c.executionCtx &&
        c.executionCtx.waitUntil(
          cache.delete(guestTokenRequestCacheDummy.clone(), { ignoreMethod: true })
        );
    }

    if (!validateFunction(response)) {
      console.log('Failed to fetch response, got', JSON.stringify(response));
      if (elongatorRequired) {
        console.log('Elongator was required, but we failed to fetch a valid response');
        return {};
      }
      if (useElongator) {
        console.log('Elongator request failed to validate, trying again without it');
        wasElongatorDisabled = true;
      }
      useElongator = false;
      newTokenGenerated = true;
      continue;
    }
    /* If we've generated a new token, we'll cache it */
    if (c.executionCtx && newTokenGenerated && activate) {
      const cachingResponse = new Response(await activate.clone().text(), {
        headers: {
          ...tokenHeaders,
          'cache-control': `max-age=${Constants.GUEST_TOKEN_MAX_AGE}`
        }
      });
      console.log('Caching guest token');
      c.executionCtx.waitUntil(cache.put(guestTokenRequestCacheDummy.clone(), cachingResponse));
    }

    // @ts-expect-error - We'll pin the guest token to whatever response we have
    response.guestToken = guestToken;
    console.log('twitterFetch is all done here, see you soon!');
    return response;
  }

  console.log('Twitter has repeatedly denied our requests, so we give up now');

  return {};
};

export const fetchUser = async (
  username: string,
  c: Context,
  useElongator = experimentCheck(
    Experiment.ELONGATOR_PROFILE_API,
    typeof c.env.TwitterProxy !== 'undefined'
  )
): Promise<GraphQLUserResponse> => {
  return (await twitterFetch(
    c,
    `${
      Constants.TWITTER_ROOT
    }/i/api/graphql/sLVLhk0bGj3MVFEKTdax1w/UserByScreenName?variables=${encodeURIComponent(
      JSON.stringify({
        screen_name: username,
        withSafetyModeUserFields: true
      })
    )}&features=${encodeURIComponent(
      JSON.stringify({
        blue_business_profile_image_shape_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: false,
        verified_phone_label_enabled: true
      })
    )}`,
    useElongator,
    // Validator function
    (_res: unknown) => {
      const response = _res as GraphQLUserResponse;
      // If _res.data is an empty object, we have no user
      if (!Object.keys(response?.data || {}).length) {
        console.log(`response.data is empty, can't continue`);
        return false;
      }
      return !(
        response?.data?.user?.result?.__typename !== 'User' ||
        typeof response.data.user.result.legacy === 'undefined'
      );
      /*
      return !(
        typeof conversation.globalObjects === 'undefined' &&
        (typeof conversation.errors === 'undefined' ||
          conversation.errors?.[0]?.code === 239)
      );
      */
    },
    false
  )) as GraphQLUserResponse;
};

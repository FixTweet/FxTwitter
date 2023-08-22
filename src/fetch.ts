import { Constants } from './constants';
import { Experiment, experimentCheck } from './experiments';
import { generateUserAgent } from './helpers/useragent';
import { isGraphQLTweet } from './utils/graphql';

const API_ATTEMPTS = 3;
let wasElongatorDisabled = false;

export const twitterFetch = async (
  url: string,
  event: FetchEvent,
  useElongator = experimentCheck(Experiment.ELONGATOR_BY_DEFAULT, typeof TwitterProxy !== 'undefined'),
  validateFunction: (response: unknown) => boolean
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

    if (!newTokenGenerated) {
      const cachedResponse = await cache.match(guestTokenRequestCacheDummy.clone());

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
      activate = await fetch(guestTokenRequest.clone());
    }

    /* Let's grab that guest_token so we can use it */
    let activateJson: { guest_token: string };

    try {
      activateJson = (await activate?.clone().json()) as { guest_token: string };
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

    let response: unknown;
    let apiRequest;

    try {
      if (useElongator && typeof TwitterProxy !== 'undefined') {
        console.log('Fetching using elongator');
        apiRequest = await TwitterProxy.fetch(url, {
          method: 'GET',
          headers: headers
        });
        console.log('Elongator request successful');
      } else {
        apiRequest = await fetch(url, {
          method: 'GET',
          headers: headers
        });
        console.log('Guest API request successful');
      }

      response = await apiRequest?.json();
    } catch (e: unknown) {
      /* We'll usually only hit this if we get an invalid response from Twitter.
         It's uncommon, but it happens */
      console.error('Unknown error while fetching from API', e);
      !useElongator &&
        event &&
        event.waitUntil(
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

    if (
      !wasElongatorDisabled &&
      !useElongator &&
      typeof TwitterProxy !== 'undefined' &&
      // @ts-expect-error This is safe due to optional chaining
      (response as TweetResultsByRestIdResult)?.data?.tweetResult?.result?.reason ===
        'NsfwLoggedOut'
    ) {
      console.log(`nsfw tweet detected, it's elongator time`);
      useElongator = true;
      continue;
    }

    const remainingRateLimit = parseInt(
      apiRequest.headers.get('x-rate-limit-remaining') || '0'
    );
    console.log(`Remaining rate limit: ${remainingRateLimit} requests`);
    /* Running out of requests within our rate limit, let's purge the cache */
    if (!useElongator && remainingRateLimit < 10) {
      console.log(`Purging token on this edge due to low rate limit remaining`);
      event &&
        event.waitUntil(
          cache.delete(guestTokenRequestCacheDummy.clone(), { ignoreMethod: true })
        );
    }

    if (!validateFunction(response)) {
      console.log('Failed to fetch response, got', JSON.stringify(response));
      if (useElongator) {
        console.log('Elongator request failed to validate, trying again without it');
        wasElongatorDisabled = true;
      }
      useElongator = false;
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
      event.waitUntil(cache.put(guestTokenRequestCacheDummy.clone(), cachingResponse));
    }

    // @ts-expect-error - We'll pin the guest token to whatever response we have
    response.guestToken = guestToken;
    console.log('twitterFetch is all done here, see you soon!');
    return response;
  }

  console.log('Twitter has repeatedly denied our requests, so we give up now');

  return {};
};

export const fetchConversation = async (
  status: string,
  event: FetchEvent,
  useElongator = experimentCheck(Experiment.ELONGATOR_BY_DEFAULT, typeof TwitterProxy !== 'undefined')
): Promise<TweetResultsByRestIdResult> => {
  return (await twitterFetch(
    `${
      Constants.TWITTER_ROOT
    }/i/api/graphql/2ICDjqPd81tulZcYrtpTuQ/TweetResultByRestId?variables=${encodeURIComponent(
      JSON.stringify({
        tweetId: status,
        withCommunity: false,
        includePromotedContent: false,
        withVoice: false
      })
    )}&features=${encodeURIComponent(
      JSON.stringify({
        creator_subscriptions_tweet_preview_api_enabled: true,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        responsive_web_media_download_video_enabled: false,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_enhance_cards_enabled: false
      })
    )}&fieldToggles=${encodeURIComponent(
      JSON.stringify({
        // TODO Figure out what this property does
        withArticleRichContentState: false
      })
    )}`,
    event,
    useElongator,
    (_conversation: unknown) => {
      const conversation = _conversation as TweetResultsByRestIdResult;
      // If we get a not found error it's still a valid response
      const tweet = conversation.data?.tweetResult?.result;
      if (isGraphQLTweet(tweet)) {
        return true;
      }
      console.log('invalid graphql tweet');
      if (tweet?.__typename === 'TweetUnavailable' && tweet.reason === 'NsfwLoggedOut') {
        console.log('tweet is nsfw');
        return true;
      }
      if (tweet?.__typename === 'TweetUnavailable' && tweet.reason === 'Protected') {
        console.log('tweet is protected');
        return true;
      }
      if (tweet?.__typename === 'TweetUnavailable') {
        console.log('generic tweet unavailable error');
        return true;
      }
      // Final clause for checking if it's valid is if there's errors
      return Array.isArray(conversation.errors);
    }
  )) as TweetResultsByRestIdResult;
};

export const fetchUser = async (
  username: string,
  event: FetchEvent,
  useElongator = false
): Promise<GraphQLUserResponse> => {
  return (await twitterFetch(
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
    event,
    useElongator,
    // Validator function
    (_res: unknown) => {
      const response = _res as GraphQLUserResponse;
      // If _res.data is an empty object, we have no user
      if (!Object.keys(response?.data).length) {
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
    }
  )) as GraphQLUserResponse;
};

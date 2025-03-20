import { Constants } from '../../constants';
import { twitterFetch } from '../../fetch';
import { buildAPITwitterStatus } from './processor';
import { Experiment, experimentCheck } from '../../experiments';
import { isGraphQLTwitterStatus } from '../../helpers/graphql';
import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { APITwitterStatus, FetchResults, InputFlags, SocialThread } from '../../types/types';

const writeDataPoint = (
  c: Context,
  language: string | undefined,
  nsfw: boolean | null,
  returnCode: string,
  flags?: InputFlags
) => {
  console.log('Writing data point...');
  if (typeof c.env?.AnalyticsEngine !== 'undefined') {
    const flagString =
      Object.keys(flags || {})
        // @ts-expect-error - TypeScript doesn't like iterating over the keys, but that's OK
        .filter(flag => flags?.[flag])[0] || 'standard';

    console.log(flagString);

    c.env?.AnalyticsEngine.writeDataPoint({
      blobs: [
        c.req.raw.cf?.colo as string /* Datacenter location */,
        c.req.raw.cf?.country as string /* Country code */,
        c.req.header('user-agent') ?? '' /* User agent (for aggregating bots calling) */,
        returnCode /* Return code */,
        flagString /* Type of request */,
        language ?? '' /* For translate feature */
      ],
      doubles: [nsfw ? 1 : 0 /* NSFW media = 1, No NSFW Media = 0 */]
    });
  }
};

export const fetchTweetDetail = async (
  c: Context,
  status: string,
  useElongator = typeof c.env?.TwitterProxy !== 'undefined',
  cursor: string | null = null
): Promise<TweetDetailResult> => {
  return (await twitterFetch(
    c,
    `${
      Constants.TWITTER_ROOT
    }/i/api/graphql/7xdlmKfKUJQP7D7woCL5CA/TweetDetail?variables=${encodeURIComponent(
      JSON.stringify({
        focalTweetId: status,
        referrer: 'home',
        with_rux_injections: false,
        includePromotedContent: false,
        withCommunity: false,
        withBirdwatchNotes: false,
        withQuickPromoteEligibilityTweetFields: false,
        withVoice: false,
        withV2Timeline: true,
        cursor: cursor
      })
    )}&features=${encodeURIComponent(
      JSON.stringify({
        c9s_tweet_anatomy_moderator_badge_enabled: false,
        responsive_web_graphql_exclude_directive_enabled: false,
        verified_phone_label_enabled: false,
        responsive_web_home_pinned_timelines_enabled: false,
        creator_subscriptions_tweet_preview_api_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: false,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        responsive_web_media_download_video_enabled: true,
        responsive_web_enhance_cards_enabled: true
      })
    )}&fieldToggles=${encodeURIComponent(
      JSON.stringify({
        withArticleRichContentState: true
      })
    )}`,
    useElongator,
    (_conversation: unknown) => {
      const conversation = _conversation as TweetDetailResult;
      const response = processResponse(
        conversation?.data?.threaded_conversation_with_injections_v2?.instructions
      );
      const tweet = findStatusInBucket(status, response);
      if (tweet && isGraphQLTwitterStatus(tweet)) {
        return true;
      }
      console.log('invalid graphql tweet', tweet);
      console.log('finding status', status);
      console.log('from response', JSON.stringify(response));

      return Array.isArray(conversation?.errors);
    },
    true
  )) as TweetDetailResult;
};

export const fetchByRestId = async (
  status: string,
  c: Context,
  useElongator = experimentCheck(
    Experiment.ELONGATOR_BY_DEFAULT,
    typeof c.env?.TwitterProxy !== 'undefined'
  )
): Promise<TweetResultsByRestIdResult> => {
  return (await twitterFetch(
    c,
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
        withArticleRichContentState: true
      })
    )}`,
    useElongator,
    (_conversation: unknown) => {
      const conversation = _conversation as TweetResultsByRestIdResult;
      // If we get a not found error it's still a valid response
      const tweet = conversation.data?.tweetResult?.result;
      if (isGraphQLTwitterStatus(tweet)) {
        return true;
      }
      console.log('invalid graphql tweet');
      if (
        !tweet &&
        typeof conversation.data?.tweetResult === 'object' &&
        Object.keys(conversation.data?.tweetResult || {}).length === 0
      ) {
        console.log('tweet was not found');
        return true;
      }
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
    },
    false
  )) as TweetResultsByRestIdResult;
};

const processResponse = (instructions: ThreadInstruction[]): GraphQLProcessBucket => {
  const bucket: GraphQLProcessBucket = {
    statuses: [],
    allStatuses: [],
    cursors: []
  };
  instructions?.forEach?.(instruction => {
    if (instruction.type === 'TimelineAddEntries' || instruction.type === 'TimelineAddToModule') {
      // @ts-expect-error Use entries or moduleItems depending on the type
      (instruction?.entries ?? instruction?.moduleItems)?.forEach(_entry => {
        const entry = _entry as
          | GraphQLTimelineTweetEntry
          | GraphQLConversationThread
          | GraphQLModuleTweetEntry;
        const content =
          (entry as GraphQLModuleTweetEntry)?.item ?? (entry as GraphQLTimelineTweetEntry)?.content;

        if (typeof content === 'undefined') {
          return;
        }
        if (content.__typename === 'TimelineTimelineItem') {
          const itemContentType = content.itemContent?.__typename;
          if (itemContentType === 'TimelineTweet') {
            const entryType = content.itemContent.tweet_results.result?.__typename;
            if (entryType === 'Tweet') {
              bucket.statuses.push(
                content.itemContent.tweet_results.result as GraphQLTwitterStatus
              );
            }
            if (entryType === 'TweetWithVisibilityResults') {
              bucket.statuses.push(
                content.itemContent.tweet_results.result.tweet as GraphQLTwitterStatus
              );
            }
          } else if (itemContentType === 'TimelineTimelineCursor') {
            bucket.cursors.push(content.itemContent as GraphQLTimelineCursor);
          }
        } else if (
          (content as unknown as GraphQLTimelineModule).__typename === 'TimelineTimelineModule'
        ) {
          content.items.forEach(item => {
            const itemContentType = item.item.itemContent.__typename;
            if (itemContentType === 'TimelineTweet') {
              const entryType = item.item.itemContent.tweet_results?.result?.__typename;
              if (entryType === 'Tweet') {
                bucket.statuses.push(
                  item.item.itemContent.tweet_results.result as GraphQLTwitterStatus
                );
              }
              if (entryType === 'TweetWithVisibilityResults') {
                bucket.statuses.push(
                  item.item.itemContent.tweet_results.result.tweet as GraphQLTwitterStatus
                );
              }
            } else if (itemContentType === 'TimelineTimelineCursor') {
              bucket.cursors.push(item.item.itemContent as GraphQLTimelineCursor);
            }
          });
        }
      });
    }
  });

  return bucket;
};

const findStatusInBucket = (
  id: string,
  bucket: GraphQLProcessBucket
): GraphQLTwitterStatus | null => {
  return bucket.statuses.find(status => (status.rest_id ?? status.legacy?.id_str) === id) ?? null;
};

const findNextStatus = (id: string, bucket: GraphQLProcessBucket): number => {
  return bucket.statuses.findIndex(status => status.legacy?.in_reply_to_status_id_str === id);
};

const findPreviousStatus = (id: string, bucket: GraphQLProcessBucket): number => {
  const status = bucket.allStatuses.find(
    status => (status.rest_id ?? status.legacy?.id_str) === id
  );
  if (!status) {
    console.log('uhhh, we could not even find that tweet, dunno how that happened');
    return -1;
  }
  if ((status.rest_id ?? status.legacy?.id_str) === status.legacy?.in_reply_to_status_id_str) {
    console.log('Tweet does not have a parent');
    return 0;
  }
  return bucket.allStatuses.findIndex(
    _status =>
      (_status.rest_id ?? _status.legacy?.id_str) === status.legacy?.in_reply_to_status_id_str
  );
};

const consolidateCursors = (
  oldCursors: GraphQLTimelineCursor[],
  newCursors: GraphQLTimelineCursor[]
): GraphQLTimelineCursor[] => {
  /* Update the Bottom/Top cursor with the new one if applicable. Otherwise, keep the old one */
  return oldCursors.map(cursor => {
    const newCursor = newCursors.find(_cursor => _cursor.cursorType === cursor.cursorType);
    if (newCursor) {
      return newCursor;
    }
    return cursor;
  });
};

const filterBucketStatuses = (tweets: GraphQLTwitterStatus[], original: GraphQLTwitterStatus) => {
  return tweets.filter(
    tweet =>
      tweet.core?.user_results?.result?.rest_id === original.core?.user_results?.result?.rest_id
  );
};

/* Fetch and construct a Twitter thread */
export const constructTwitterThread = async (
  id: string,
  processThread = false,
  c: Context,
  language: string | undefined,
  legacyAPI = false
): Promise<SocialThread> => {
  console.log('language', language);

  let response: TweetDetailResult | TweetResultsByRestIdResult | null = null;
  let status: APITwitterStatus;
  let url: URL;

  try {
    url = new URL(c.req.url);
  } catch (e) {
    console.log('Error parsing URL', e);
    url = new URL('https://api.fxtwitter.com/');
  }

  console.log('env', c.env);
  /* We can use TweetDetail on elongator accounts to increase per-account rate limit.
     We also use TweetDetail to process threads (WIP)
     
     Also - dirty hack. Right now, TweetDetail requests aren't working with language and I haven't figured out why.
     I'll figure out why eventually, but for now just don't use TweetDetail for this. */
  if (
    typeof c.env?.TwitterProxy !== 'undefined' &&
    !language &&
    (experimentCheck(Experiment.TWEET_DETAIL_API) || processThread || url.hostname.includes('api'))
  ) {
    console.log('Using TweetDetail for request...');
    response = (await fetchTweetDetail(c, id)) as TweetDetailResult;

    console.log('response', response);

    if (!response?.data) {
      writeDataPoint(c, language, null, '404');
      return { status: null, thread: null, author: null, code: 404 };
    }
  }

  /* If we didn't get a response from TweetDetail we should ignore threads and try TweetResultsByRestId */
  if (!response) {
    console.log('Using TweetResultsByRestId for request...');
    response = (await fetchByRestId(id, c)) as TweetResultsByRestIdResult;

    const result = response?.data?.tweetResult?.result as GraphQLTwitterStatus;

    if (typeof result === 'undefined') {
      writeDataPoint(c, language, null, '404');
      return { status: null, thread: null, author: null, code: 404 };
    }

    const buildStatus = await buildAPITwitterStatus(c, result, language, null, legacyAPI);

    if ((buildStatus as FetchResults)?.status === 401) {
      writeDataPoint(c, language, null, '401');
      return { status: null, thread: null, author: null, code: 401 };
    } else if (buildStatus === null || (buildStatus as FetchResults)?.status === 404) {
      writeDataPoint(c, language, null, '404');
      return { status: null, thread: null, author: null, code: 404 };
    }

    status = buildStatus as APITwitterStatus;

    writeDataPoint(c, language, status.possibly_sensitive, '200');
    return { status: status, thread: null, author: status.author, code: 200 };
  }

  const bucket = processResponse(
    response?.data?.threaded_conversation_with_injections_v2?.instructions ?? []
  );
  const originalStatus = findStatusInBucket(id, bucket);

  /* Don't bother processing thread on a null tweet */
  if (originalStatus === null) {
    writeDataPoint(c, language, null, '404');
    return { status: null, thread: null, author: null, code: 404 };
  }

  status = (await buildAPITwitterStatus(
    c,
    originalStatus,
    undefined,
    null,
    legacyAPI
  )) as APITwitterStatus;

  if (status === null) {
    writeDataPoint(c, language, null, '404');
    return { status: null, thread: null, author: null, code: 404 };
  }

  const author = status.author;

  /* If we're not processing threads, let's be done here */
  if (!processThread) {
    writeDataPoint(c, language, status.possibly_sensitive, '200');
    return { status: status, thread: null, author: author, code: 200 };
  }

  const threadStatuses = [originalStatus];
  bucket.allStatuses = bucket.statuses;
  bucket.statuses = filterBucketStatuses(bucket.statuses, originalStatus);

  let currentId = id;

  /* Process tweets that are following the current one in the thread */
  while (findNextStatus(currentId, bucket) !== -1) {
    const index = findNextStatus(currentId, bucket);
    const tweet = bucket.statuses[index];

    const newCurrentId = tweet.rest_id ?? tweet.legacy?.id_str;

    console.log(
      'adding next tweet to thread',
      newCurrentId,
      'from',
      currentId,
      'at index',
      index,
      'in bucket'
    );

    threadStatuses.push(tweet);

    currentId = newCurrentId;

    console.log('Current index', index, 'of', bucket.statuses.length);

    /* Reached the end of the current list of statuses in thread) */
    if (index >= bucket.statuses.length - 1) {
      /* See if we have a cursor to fetch more statuses */
      const cursor = bucket.cursors.find(
        cursor => cursor.cursorType === 'Bottom' || cursor.cursorType === 'ShowMore'
      );
      console.log('current cursors: ', bucket.cursors);
      if (!cursor) {
        console.log('No cursor present, stopping pagination down');
        break;
      }
      console.log('Cursor present, fetching more tweets down');

      let loadCursor: TweetDetailResult;

      try {
        loadCursor = await fetchTweetDetail(c, id, true, cursor.value);

        if (
          typeof loadCursor?.data?.threaded_conversation_with_injections_v2?.instructions ===
          'undefined'
        ) {
          console.log('Unknown data while fetching cursor', loadCursor);
          break;
        }
      } catch (e) {
        console.log('Error fetching cursor', e);
        break;
      }

      const cursorResponse = processResponse(
        loadCursor?.data?.threaded_conversation_with_injections_v2?.instructions ?? []
      );
      bucket.statuses = bucket.statuses.concat(
        filterBucketStatuses(cursorResponse.statuses, originalStatus)
      );
      /* Remove old cursor and add new bottom cursor if necessary */
      consolidateCursors(bucket.cursors, cursorResponse.cursors);
      console.log('updated bucket of cursors', bucket.cursors);
    }

    console.log('Preview of next status:', findNextStatus(currentId, bucket));
  }

  currentId = id;

  while (findPreviousStatus(currentId, bucket) !== -1) {
    const index = findPreviousStatus(currentId, bucket);
    const status = bucket.allStatuses[index];
    const newCurrentId = status.rest_id ?? status.legacy?.id_str;

    console.log(
      'adding previous status to thread',
      newCurrentId,
      'from',
      currentId,
      'at index',
      index,
      'in bucket'
    );

    threadStatuses.unshift(status);

    currentId = newCurrentId;

    if (index === 0) {
      /* See if we have a cursor to fetch more statuses */
      const cursor = bucket.cursors.find(
        cursor => cursor.cursorType === 'Top' || cursor.cursorType === 'ShowMore'
      );
      console.log('current cursors: ', bucket.cursors);
      if (!cursor) {
        console.log('No cursor present, stopping pagination up');
        break;
      }
      console.log('Cursor present, fetching more statuses up');

      let loadCursor: TweetDetailResult;

      try {
        loadCursor = await fetchTweetDetail(c, id, true, cursor.value);

        if (
          typeof loadCursor?.data?.threaded_conversation_with_injections_v2?.instructions ===
          'undefined'
        ) {
          console.log('Unknown data while fetching cursor', loadCursor);
          break;
        }
      } catch (e) {
        console.log('Error fetching cursor', e);
        break;
      }
      const cursorResponse = processResponse(
        loadCursor?.data?.threaded_conversation_with_injections_v2?.instructions ?? []
      );
      bucket.statuses = cursorResponse.statuses.concat(
        filterBucketStatuses(bucket.statuses, originalStatus)
      );
      /* Remove old cursor and add new top cursor if necessary */
      consolidateCursors(bucket.cursors, cursorResponse.cursors);

      // console.log('updated bucket of statuses', bucket.statuses);
      console.log('updated bucket of cursors', bucket.cursors);
    }

    console.log('Preview of previous status:', findPreviousStatus(currentId, bucket));
  }

  const socialThread: SocialThread = {
    status: status,
    thread: [],
    author: author,
    code: 200
  };

  await Promise.all(
    threadStatuses.map(async status => {
      const builtStatus = (await buildAPITwitterStatus(
        c,
        status,
        undefined,
        author,
        false
      )) as APITwitterStatus;
      socialThread.thread?.push(builtStatus);
    })
  );

  // Sort socialThread.thread by id converted to bigint
  socialThread.thread?.sort((a, b) => {
    const aId = BigInt(a.id);
    const bId = BigInt(b.id);
    if (aId < bId) {
      return -1;
    }
    if (aId > bId) {
      return 1;
    }
    return 0;
  });

  return socialThread;
};

export const threadAPIProvider = async (c: Context) => {
  const id = c.req.param('id') as string;

  const processedResponse = await constructTwitterThread(id, true, c, undefined);

  // Add every header from Constants.API_RESPONSE_HEADERS
  for (const [header, value] of Object.entries(Constants.API_RESPONSE_HEADERS)) {
    c.header(header, value);
  }
  return c.json(processedResponse, processedResponse.code as ContentfulStatusCode);
};

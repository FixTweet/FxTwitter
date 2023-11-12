import { Constants } from '../../constants';
import { twitterFetch } from '../../fetch';
import { buildAPITweet } from './processor';
import { Experiment, experimentCheck } from '../../experiments';
import { isGraphQLTweet } from '../../helpers/graphql';
import { Context } from 'hono';

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
      const tweet = findTweetInBucket(
        status,
        processResponse(conversation?.data?.threaded_conversation_with_injections_v2?.instructions)
      );
      if (tweet && isGraphQLTweet(tweet)) {
        return true;
      }
      console.log('invalid graphql tweet', conversation);
      const firstInstruction = (
        conversation?.data?.threaded_conversation_with_injections_v2
          ?.instructions?.[0] as TimelineAddEntriesInstruction
      )?.entries?.[0];
      if (
        (
          (firstInstruction as { content: GraphQLTimelineItem })?.content
            ?.itemContent as GraphQLTimelineTweet
        )?.tweet_results?.result?.__typename === 'TweetTombstone'
      ) {
        console.log('tweet is private');
        return true;
      }

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
      if (isGraphQLTweet(tweet)) {
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
    tweets: [],
    cursors: []
  };
  instructions.forEach?.(instruction => {
    if (instruction.type === 'TimelineAddEntries' || instruction.type === 'TimelineAddToModule') {
      // @ts-expect-error Use entries or moduleItems depending on the type
      (instruction?.entries ?? instruction.moduleItems).forEach(_entry => {
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
            const entryType = content.itemContent.tweet_results.result.__typename;
            if (entryType === 'Tweet') {
              bucket.tweets.push(content.itemContent.tweet_results.result as GraphQLTweet);
            }
            if (entryType === 'TweetWithVisibilityResults') {
              bucket.tweets.push(content.itemContent.tweet_results.result.tweet as GraphQLTweet);
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
                bucket.tweets.push(item.item.itemContent.tweet_results.result as GraphQLTweet);
              }
              if (entryType === 'TweetWithVisibilityResults') {
                bucket.tweets.push(
                  item.item.itemContent.tweet_results.result.tweet as GraphQLTweet
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

const findTweetInBucket = (id: string, bucket: GraphQLProcessBucket): GraphQLTweet | null => {
  return bucket.tweets.find(tweet => (tweet.rest_id ?? tweet.legacy?.id_str) === id) ?? null;
};

const findNextTweet = (id: string, bucket: GraphQLProcessBucket): number => {
  return bucket.tweets.findIndex(tweet => tweet.legacy?.in_reply_to_status_id_str === id);
};

const findPreviousTweet = (id: string, bucket: GraphQLProcessBucket): number => {
  const tweet = bucket.tweets.find(tweet => (tweet.rest_id ?? tweet.legacy?.id_str) === id);
  if (!tweet) {
    console.log('uhhh, we could not even find that tweet, dunno how that happened');
    return -1;
  }
  return bucket.tweets.findIndex(
    _tweet => (_tweet.rest_id ?? _tweet.legacy?.id_str) === tweet.legacy?.in_reply_to_status_id_str
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

const filterBucketTweets = (tweets: GraphQLTweet[], original: GraphQLTweet) => {
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
  let post: APITweet;
  /* We can use TweetDetail on elongator accounts to increase per-account rate limit.
     We also use TweetDetail to process threads (WIP)
     
     Also - dirty hack. Right now, TweetDetail requests aren't working with language and I haven't figured out why.
     I'll figure out why eventually, but for now just don't use TweetDetail for this. */
  if (
    typeof c.env?.TwitterProxy !== 'undefined' &&
    !language &&
    (experimentCheck(Experiment.TWEET_DETAIL_API) || processThread)
  ) {
    console.log('Using TweetDetail for request...');
    response = (await fetchTweetDetail(c, id)) as TweetDetailResult;

    console.log(response);

    const firstInstruction = (
      response?.data?.threaded_conversation_with_injections_v2
        ?.instructions?.[0] as TimelineAddEntriesInstruction
    )?.entries?.[0];
    if (
      (
        (firstInstruction as { content: GraphQLTimelineItem })?.content
          ?.itemContent as GraphQLTimelineTweet
      )?.tweet_results?.result?.__typename === 'TweetTombstone' /* If a tweet is private */
    ) {
      console.log('tweet is private');
      return { post: null, thread: null, author: null, code: 401 };
    } else if (!response?.data) {
      return { post: null, thread: null, author: null, code: 404 };
    }
  }

  /* If we didn't get a response from TweetDetail we should ignore threads and try TweetResultsByRestId */
  if (!response) {
    console.log('Using TweetResultsByRestId for request...');
    response = (await fetchByRestId(id, c)) as TweetResultsByRestIdResult;

    const result = response?.data?.tweetResult?.result as GraphQLTweet;

    if (typeof result === 'undefined') {
      return { post: null, thread: null, author: null, code: 404 };
    }

    const buildPost = await buildAPITweet(c, result, language, false, legacyAPI);

    if ((buildPost as FetchResults)?.status === 401) {
      return { post: null, thread: null, author: null, code: 401 };
    } else if (buildPost === null || (buildPost as FetchResults)?.status === 404) {
      return { post: null, thread: null, author: null, code: 404 };
    }

    post = buildPost as APITweet;

    return { post: post, thread: null, author: post.author, code: 200 };
  }

  const bucket = processResponse(
    response?.data?.threaded_conversation_with_injections_v2?.instructions ?? []
  );
  const originalTweet = findTweetInBucket(id, bucket);

  /* Don't bother processing thread on a null tweet */
  if (originalTweet === null) {
    return { post: null, thread: null, author: null, code: 404 };
  }

  post = (await buildAPITweet(c, originalTweet, undefined, false, legacyAPI)) as APITweet;

  if (post === null) {
    return { post: null, thread: null, author: null, code: 404 };
  }

  const author = post.author;

  /* If we're not processing threads, let's be done here */
  if (!processThread) {
    return { post: post, thread: null, author: author, code: 200 };
  }

  const threadTweets = [originalTweet];
  bucket.tweets = filterBucketTweets(bucket.tweets, originalTweet);

  let currentId = id;

  /* Process tweets that are following the current one in the thread */
  while (findNextTweet(currentId, bucket) !== -1) {
    const index = findNextTweet(currentId, bucket);
    const tweet = bucket.tweets[index];

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

    threadTweets.push(tweet);

    currentId = newCurrentId;

    console.log('Current index', index, 'of', bucket.tweets.length);

    /* Reached the end of the current list of tweets in thread) */
    if (index >= bucket.tweets.length - 1) {
      /* See if we have a cursor to fetch more tweets */
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
      bucket.tweets = bucket.tweets.concat(
        filterBucketTweets(cursorResponse.tweets, originalTweet)
      );
      /* Remove old cursor and add new bottom cursor if necessary */
      consolidateCursors(bucket.cursors, cursorResponse.cursors);
      console.log('updated bucket of cursors', bucket.cursors);
    }

    console.log('Preview of next tweet:', findNextTweet(currentId, bucket));
  }

  currentId = id;

  while (findPreviousTweet(currentId, bucket) !== -1) {
    const index = findPreviousTweet(currentId, bucket);
    const tweet = bucket.tweets[index];
    const newCurrentId = tweet.rest_id ?? tweet.legacy?.id_str;

    console.log(
      'adding previous tweet to thread',
      newCurrentId,
      'from',
      currentId,
      'at index',
      index,
      'in bucket'
    );

    threadTweets.unshift(tweet);

    currentId = newCurrentId;

    if (index === 0) {
      /* See if we have a cursor to fetch more tweets */
      const cursor = bucket.cursors.find(
        cursor => cursor.cursorType === 'Top' || cursor.cursorType === 'ShowMore'
      );
      console.log('current cursors: ', bucket.cursors);
      if (!cursor) {
        console.log('No cursor present, stopping pagination up');
        break;
      }
      console.log('Cursor present, fetching more tweets up');

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
      bucket.tweets = cursorResponse.tweets.concat(
        filterBucketTweets(bucket.tweets, originalTweet)
      );
      /* Remove old cursor and add new top cursor if necessary */
      consolidateCursors(bucket.cursors, cursorResponse.cursors);

      // console.log('updated bucket of tweets', bucket.tweets);
      console.log('updated bucket of cursors', bucket.cursors);
    }

    console.log('Preview of previous tweet:', findPreviousTweet(currentId, bucket));
  }

  const socialThread: SocialThread = {
    post: post,
    thread: [],
    author: author,
    code: 200
  };

  threadTweets.forEach(async tweet => {
    socialThread.thread?.push((await buildAPITweet(c, tweet, undefined, true, false)) as APITweet);
  });

  return socialThread;
};

export const threadAPIProvider = async (c: Context) => {
  const id = c.req.param('id') as string;

  const processedResponse = await constructTwitterThread(id, true, c, undefined);

  c.status(processedResponse.code);
  // Add every header from Constants.API_RESPONSE_HEADERS
  for (const [header, value] of Object.entries(Constants.API_RESPONSE_HEADERS)) {
    c.header(header, value);
  }
  return c.json(processedResponse);
};

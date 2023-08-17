import { renderCard } from '../helpers/card';
import { Constants } from '../constants';
import { fetchConversation } from '../fetch';
import { linkFixer } from '../helpers/linkFixer';
import { handleMosaic } from '../helpers/mosaic';
import { colorFromPalette } from '../helpers/palette';
import { translateTweet } from '../helpers/translate';
import { unescapeText } from '../helpers/utils';
import { processMedia } from '../helpers/media';
import { convertToApiUser } from './user';
import { isGraphQLTweet, isGraphQLTweetNotFoundResponse } from '../utils/graphql';

/* This function does the heavy lifting of processing data from Twitter API
   and using it to create FixTweet's streamlined API responses */
const populateTweetProperties = async (
  tweet: GraphQLTweet,
  conversation: any, // TimelineBlobPartial,
  language: string | undefined
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<APITweet> => {
  const apiTweet = {} as APITweet;

  if (typeof tweet.core === 'undefined' && typeof tweet.result !== 'undefined') {
    tweet = tweet.result;
  } else {
    console.log('tweet core exists');
  }

  /* With v2 conversation API we re-add the user object ot the tweet because
     Twitter stores it separately in the conversation API. This is to consolidate
     it in case a user appears multiple times in a thread. */
  const graphQLUser = tweet.core.user_results.result;
  const apiUser = convertToApiUser(graphQLUser);

  /* Populating a lot of the basics */
  apiTweet.url = `${Constants.TWITTER_ROOT}/${apiUser.screen_name}/status/${tweet.rest_id}`;
  apiTweet.id = tweet.rest_id;
  apiTweet.text = unescapeText(linkFixer(tweet, tweet.legacy.full_text || ''));
  apiTweet.author = {
    id: apiUser.id,
    name: apiUser.name,
    screen_name: apiUser.screen_name,
    avatar_url:
      (apiUser.avatar_url || '').replace('_normal', '_200x200') || '',
    avatar_color: '0000FF' /* colorFromPalette(
      tweet.user?.profile_image_extensions_media_color?.palette || []
    ),*/,
    banner_url: apiUser.banner_url || ''
  };
  apiTweet.replies = tweet.legacy.reply_count;
  apiTweet.retweets = tweet.legacy.retweet_count;
  apiTweet.likes = tweet.legacy.favorite_count;
  apiTweet.color = apiTweet.author.avatar_color;
  apiTweet.twitter_card = 'tweet';
  apiTweet.created_at = tweet.legacy.created_at;
  apiTweet.created_timestamp = new Date(tweet.legacy.created_at).getTime() / 1000;

  apiTweet.possibly_sensitive = tweet.legacy.possibly_sensitive;

  if (tweet.views.state === 'EnabledWithCount') {
    apiTweet.views = parseInt(tweet.views.count || '0') ?? null;
  } else {
    apiTweet.views = null;
  }

  if (tweet.legacy.lang !== 'unk') {
    apiTweet.lang = tweet.legacy.lang;
  } else {
    apiTweet.lang = null;
  }

  apiTweet.replying_to = tweet.legacy?.in_reply_to_screen_name || null;
  apiTweet.replying_to_status = tweet.legacy?.in_reply_to_status_id_str || null;
  
  const mediaList = Array.from(
    tweet.legacy.extended_entities?.media || tweet.legacy.entities?.media || []
  );

  // console.log('tweet', JSON.stringify(tweet));

  /* Populate this Tweet's media */
  mediaList.forEach(media => {
    const mediaObject = processMedia(media);
    if (mediaObject) {
      apiTweet.media = apiTweet.media || {};
      apiTweet.media.all = apiTweet.media?.all || [];
      apiTweet.media.all.push(mediaObject);

      if (mediaObject.type === 'photo') {
        apiTweet.twitter_card = 'summary_large_image';
        apiTweet.media.photos = apiTweet.media.photos || [];
        apiTweet.media.photos.push(mediaObject);
      } else if (mediaObject.type === 'video' || mediaObject.type === 'gif') {
        apiTweet.twitter_card = 'player';
        apiTweet.media.videos = apiTweet.media.videos || [];
        apiTweet.media.videos.push(mediaObject);
      }
    }
  });

  /* Grab color palette data */
  /*
  if (mediaList[0]?.ext_media_color?.palette) {
    apiTweet.color = colorFromPalette(mediaList[0].ext_media_color.palette);
  }
  */
  console.log('note_tweet', JSON.stringify(tweet.note_tweet));
  console.log('note tweet text', tweet.note_tweet?.note_tweet_results?.result?.text)
  console.log('mediaList.length <= 0', mediaList.length <= 0)
  console.log('tweet.legacy.entities?.urls?.length <= 0', tweet.legacy.entities?.urls?.length <= 0)
  const noteTweetText = tweet.note_tweet?.note_tweet_results?.result?.text;
  /* For now, don't include note tweets */
  if (noteTweetText && mediaList.length <= 0 && tweet.legacy.entities?.urls?.length <= 0) {
    console.log('We meet the conditions to use new note tweets');
    apiTweet.text = unescapeText(noteTweetText);
  }

  /* Handle photos and mosaic if available */
  if ((apiTweet.media?.photos?.length || 0) > 1) {
    const mosaic = await handleMosaic(apiTweet.media?.photos || [], tweet.rest_id);
    if (typeof apiTweet.media !== 'undefined' && mosaic !== null) {
      apiTweet.media.mosaic = mosaic;
    }
  }

  // Add Tweet source but remove the link HTML tag
  if (tweet.source) {
    apiTweet.source = (tweet.source || '').replace(
      /<a href="(.+?)" rel="nofollow">(.+?)<\/a>/,
      '$2'
    );
  }

  /* Populate a Twitter card */
  
  if (tweet.card) {
    const card = renderCard(tweet.card);
    if (card.external_media) {
      apiTweet.twitter_card = 'summary_large_image';
      apiTweet.media = apiTweet.media || {};
      apiTweet.media.external = card.external_media;
    }
    if (card.poll) {
      apiTweet.poll = card.poll;
    }
  }

  /* If a language is specified in API or by user, let's try translating it! */
  if (typeof language === 'string' && language.length === 2 && language !== tweet.legacy.lang) {
    const translateAPI = await translateTweet(
      tweet,
      conversation.guestToken || '',
      language
    );
    if (translateAPI !== null && translateAPI?.translation) {
      apiTweet.translation = {
        text: unescapeText(linkFixer(tweet, translateAPI?.translation || '')),
        source_lang: translateAPI?.sourceLanguage || '',
        target_lang: translateAPI?.destinationLanguage || '',
        source_lang_en: translateAPI?.localizedSourceLanguage || ''
      };
    }
  }

  return apiTweet;
};

const writeDataPoint = (
  event: FetchEvent,
  language: string | undefined,
  nsfw: boolean,
  returnCode: string,
  flags?: InputFlags
) => {
  console.log('Writing data point...');
  if (typeof AnalyticsEngine !== 'undefined') {
    const flagString =
      Object.keys(flags || {})
        // @ts-expect-error - TypeScript doesn't like iterating over the keys, but that's OK
        .filter(flag => flags?.[flag])[0] || 'standard';

    AnalyticsEngine.writeDataPoint({
      blobs: [
        event.request.cf?.colo as string /* Datacenter location */,
        event.request.cf?.country as string /* Country code */,
        event.request.headers.get('user-agent') ??
          '' /* User agent (for aggregating bots calling) */,
        returnCode /* Return code */,
        flagString /* Type of request */,
        language ?? '' /* For translate feature */
      ],
      doubles: [nsfw ? 1 : 0 /* NSFW media = 1, No NSFW Media = 0 */],
      indexes: [event.request.headers.get('cf-ray') ?? '' /* CF Ray */]
    });
  }
};

/* API for Twitter statuses (Tweets)
   Used internally by FixTweet's embed service, or
   available for free using api.fxtwitter.com. */
export const statusAPI = async (
  status: string,
  language: string | undefined,
  event: FetchEvent,
  flags?: InputFlags
): Promise<TweetAPIResponse> => {
  let wasMediaBlockedNSFW = false;
  let res = await fetchConversation(status, event);
  const tweet = res.data?.tweetResult?.result;
  if (!tweet) {
    return { code: 404, message: 'NOT_FOUND' };
  }
  if (tweet.__typename === 'TweetUnavailable' && tweet.reason === 'NsfwLoggedOut') {
    wasMediaBlockedNSFW = true;
    res = await fetchConversation(status, event, true);
  }

  console.log(JSON.stringify(tweet))
  
  if (tweet.__typename === 'TweetUnavailable') {
    if (tweet.reason === 'Protected') {
      writeDataPoint(event, language, wasMediaBlockedNSFW, 'PRIVATE_TWEET', flags);
      return { code: 401, message: 'PRIVATE_TWEET' };
    // } else if (tweet.reason === 'NsfwLoggedOut') {
    //   // API failure as elongator should have handled this
    //   writeDataPoint(event, language, wasMediaBlockedNSFW, 'API_FAIL', flags);
    //   return { code: 500, message: 'API_FAIL' };
    } else {
      // Api failure at parsing status
      writeDataPoint(event, language, wasMediaBlockedNSFW, 'API_FAIL', flags);
      return { code: 500, message: 'API_FAIL' };
    }
  }
  // If the tweet is not a graphQL tweet something went wrong
  if (!isGraphQLTweet(tweet)) {
    console.log('Tweet was not a valid tweet', tweet);
    writeDataPoint(event, language, wasMediaBlockedNSFW, 'API_FAIL', flags);
    return { code: 500, message: 'API_FAIL' };
  }
  
  /*
  if (tweet.retweeted_status_id_str) {
    tweet = conversation?.globalObjects?.tweets?.[tweet.retweeted_status_id_str] || {};
  }
  */

  if (!tweet) {
    return { code: 404, message: 'NOT_FOUND' };
  }
  const conversation: any[] = [];
  /* Creating the response objects */
  const response: TweetAPIResponse = { code: 200, message: 'OK' } as TweetAPIResponse;
  const apiTweet: APITweet = (await populateTweetProperties(
    tweet,
    conversation,
    language
  )) as APITweet;

  /* We found a quote tweet, let's process that too */
  const quoteTweet = tweet.quoted_status_result;
  if (quoteTweet) {
    apiTweet.quote = (await populateTweetProperties(
      quoteTweet,
      conversation,
      language
    )) as APITweet;
  }

  /* Finally, staple the Tweet to the response and return it */
  response.tweet = apiTweet;

  writeDataPoint(event, language, wasMediaBlockedNSFW, 'OK', flags);

  return response;
};

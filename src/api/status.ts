import { renderCard } from '../helpers/card';
import { Constants } from '../constants';
import { fetchConversation } from '../fetch';
import { linkFixer } from '../helpers/linkFixer';
import { handleMosaic } from '../helpers/mosaic';
import { colorFromPalette } from '../helpers/palette';
import { translateTweet } from '../helpers/translate';
import { unescapeText } from '../helpers/utils';
import { processMedia } from '../helpers/media';

/* This function does the heavy lifting of processing data from Twitter API
   and using it to create FixTweet's streamlined API responses */
const populateTweetProperties = async (
  tweet: TweetPartial,
  conversation: TimelineBlobPartial,
  language: string | undefined
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<APITweet> => {
  const apiTweet = {} as APITweet;

  /* With v2 conversation API we re-add the user object ot the tweet because
     Twitter stores it separately in the conversation API. This is to consolidate
     it in case a user appears multiple times in a thread. */
  tweet.user = conversation?.globalObjects?.users?.[tweet.user_id_str] || {};

  const user = tweet.user as UserPartial;
  const screenName = user?.screen_name || '';
  const name = user?.name || '';

  /* Populating a lot of the basics */
  apiTweet.url = `${Constants.TWITTER_ROOT}/${screenName}/status/${tweet.id_str}`;
  apiTweet.id = tweet.id_str;
  apiTweet.text = unescapeText(linkFixer(tweet, tweet.full_text || ''));
  apiTweet.author = {
    name: name,
    screen_name: screenName,
    avatar_url: (user?.profile_image_url_https || '').replace('_normal', '_200x200') || '',
    avatar_color: colorFromPalette(
      tweet.user?.profile_image_extensions_media_color?.palette || []
    ),
    banner_url: user?.profile_banner_url || ''
  };
  apiTweet.replies = tweet.reply_count;
  apiTweet.retweets = tweet.retweet_count;
  apiTweet.likes = tweet.favorite_count;
  apiTweet.color = apiTweet.author.avatar_color;
  apiTweet.twitter_card = 'tweet';
  apiTweet.created_at = tweet.created_at;
  apiTweet.created_timestamp = new Date(tweet.created_at).getTime() / 1000;

  if (tweet.lang !== 'unk') {
    apiTweet.lang = tweet.lang;
  } else {
    apiTweet.lang = null;
  }

  apiTweet.replying_to = tweet.in_reply_to_screen_name || null;

  const mediaList = Array.from(
    tweet.extended_entities?.media || tweet.entities?.media || []
  );

  /* Populate this Tweet's media */
  mediaList.forEach(media => {
    const mediaObject = processMedia(media);
    if (mediaObject) {
      if (mediaObject.type === 'photo') {
        apiTweet.twitter_card = 'summary_large_image';
        apiTweet.media = apiTweet.media || {};
        apiTweet.media.photos = apiTweet.media.photos || [];
        apiTweet.media.photos.push(mediaObject);
      } else if (mediaObject.type === 'video' || mediaObject.type === 'gif') {
        apiTweet.twitter_card = 'player';
        apiTweet.media = apiTweet.media || {};
        apiTweet.media.video = mediaObject as APIVideo;
        apiTweet.media.videos = apiTweet.media.videos || [];
        apiTweet.media.videos.push(mediaObject);

        apiTweet.media.video = {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error Temporary warning
          WARNING:
            'video is deprecated and will be removed. Please use videos[0] instead.',
          ...mediaObject
        };
      }
    }
  });

  /* Grab color palette data */
  if (mediaList[0]?.ext_media_color?.palette) {
    apiTweet.color = colorFromPalette(mediaList[0].ext_media_color.palette);
  }

  /* Handle photos and mosaic if available */
  if ((apiTweet.media?.photos?.length || 0) > 1) {
    const mosaic = await handleMosaic(apiTweet.media?.photos || [], tweet.id_str);
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
    const card = await renderCard(tweet.card);
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
  if (typeof language === 'string' && language.length === 2 && language !== tweet.lang) {
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

/* API for Twitter statuses (Tweets)
   Used internally by FixTweet's embed service, or
   available for free using api.fxtwitter.com. */
export const statusAPI = async (
  status: string,
  language: string | undefined,
  event: FetchEvent
): Promise<APIResponse> => {
  let conversation = await fetchConversation(status, event);
  let tweet = conversation?.globalObjects?.tweets?.[status] || {};

  if (tweet.retweeted_status_id_str) {
    tweet = conversation?.globalObjects?.tweets?.[tweet.retweeted_status_id_str] || {};
  }

  /* Fallback for if Tweet did not load (i.e. NSFW) */
  if (typeof tweet.full_text === 'undefined') {
    console.log('Invalid status, got tweet ', tweet, ' conversation ', conversation);

    if (conversation.timeline?.instructions?.length > 0) {
      /* Try again using elongator API proxy */
      console.log('No Tweet was found, loading again from elongator');
      conversation = await fetchConversation(status, event, true);
      tweet = conversation?.globalObjects?.tweets?.[status] || {};

      if (typeof tweet.full_text !== 'undefined') {
        console.log('Successfully loaded Tweet using elongator');
      } else if (
        typeof tweet.full_text === 'undefined' &&
        conversation.timeline?.instructions?.length > 0
      ) {
        console.log(
          'Tweet could not be accessed with elongator, must be private/suspended'
        );
        return { code: 401, message: 'PRIVATE_TWEET' };
      }
    } else {
      /* {"errors":[{"code":34,"message":"Sorry, that page does not exist."}]} */
      if (conversation.errors?.[0]?.code === 34) {
        return { code: 404, message: 'NOT_FOUND' };
      }

      /* Tweets object is completely missing, smells like API failure */
      if (typeof conversation?.globalObjects?.tweets === 'undefined') {
        return { code: 500, message: 'API_FAIL' };
      }

      /* If we have no idea what happened then just return API error */
      return { code: 500, message: 'API_FAIL' };
    }
  }

  /* Creating the response objects */
  const response: APIResponse = { code: 200, message: 'OK' } as APIResponse;
  const apiTweet: APITweet = (await populateTweetProperties(
    tweet,
    conversation,
    language
  )) as APITweet;

  /* We found a quote tweet, let's process that too */
  const quoteTweet =
    conversation.globalObjects?.tweets?.[tweet.quoted_status_id_str || '0'] || null;
  if (quoteTweet) {
    apiTweet.quote = (await populateTweetProperties(
      quoteTweet,
      conversation,
      language
    )) as APITweet;
  }

  /* Finally, staple the Tweet to the response and return it */
  response.tweet = apiTweet;

  return response;
};

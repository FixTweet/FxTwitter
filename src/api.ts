import { renderCard } from './card';
import { Constants } from './constants';
import { fetchUsingGuest } from './fetch';
import { linkFixer } from './linkFixer';
import { handleMosaic } from './mosaic';
import { colorFromPalette } from './palette';
import { translateTweet } from './translate';

const processMedia = (media: TweetMedia): APIPhoto | APIVideo | null => {
  if (media.type === 'photo') {
    return {
      type: 'photo',
      url: media.media_url_https,
      width: media.original_info.width,
      height: media.original_info.height
    };
  } else if (media.type === 'video' || media.type === 'animated_gif') {
    // Find the variant with the highest bitrate
    let bestVariant = media.video_info?.variants?.reduce?.((a, b) =>
      (a.bitrate ?? 0) > (b.bitrate ?? 0) ? a : b
    );
    return {
      url: bestVariant?.url || '',
      thumbnail_url: media.media_url_https,
      width: media.original_info.width,
      height: media.original_info.height,
      format: bestVariant?.content_type || '',
      type: media.type === 'animated_gif' ? 'gif' : 'video'
    };
  }
  return null;
};

const populateTweetProperties = async (
  tweet: TweetPartial,
  conversation: TimelineBlobPartial,
  language: string = 'en'
): Promise<APITweet> => {
  let apiTweet = {} as APITweet;

  /* With v2 conversation API we re-add the user object ot the tweet because
     Twitter stores it separately in the conversation API. This is to consolidate
     it in case a user appears multiple times in a thread. */
  tweet.user = conversation?.globalObjects?.users?.[tweet.user_id_str] || {};

  const user = tweet.user as UserPartial;
  const screenName = user?.screen_name || '';
  const name = user?.name || '';

  apiTweet.url = `${Constants.TWITTER_ROOT}/${screenName}/status/${tweet.id_str}`;
  apiTweet.text = linkFixer(tweet, tweet.full_text);
  apiTweet.author = {
    name: name,
    screen_name: screenName,
    avatar_url: user?.profile_image_url_https.replace('_normal', '_200x200') || '',
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

  if (tweet.lang !== 'unk') {
    apiTweet.lang = tweet.lang;
  } else {
    apiTweet.lang = null;
  }

  apiTweet.replying_to = tweet.in_reply_to_screen_name || null;

  let mediaList = Array.from(
    tweet.extended_entities?.media || tweet.entities?.media || []
  );

  mediaList.forEach(media => {
    let mediaObject = processMedia(media);
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
      }
    }
  });

  if (mediaList[0]?.ext_media_color?.palette) {
    apiTweet.color = colorFromPalette(mediaList[0].ext_media_color.palette);
  }

  if ((apiTweet.media?.photos?.length || 0) > 1) {
    let mosaic = await handleMosaic(apiTweet.media?.photos || []);
    if (typeof apiTweet.media !== 'undefined' && mosaic !== null) {
      apiTweet.media.mosaic = mosaic;
    }
  }

  if (tweet.card) {
    let card = await renderCard(tweet.card);
    if (card.external_media) {
      apiTweet.twitter_card = 'summary_large_image';
      apiTweet.media = apiTweet.media || {};
      apiTweet.media.external = card.external_media;
    }
    if (card.poll) {
      apiTweet.poll = card.poll;
    }
  }

  /* If a language is specified, let's try translating it! */
  if (typeof language === 'string' && language.length === 2 && language !== tweet.lang) {
    let translateAPI = await translateTweet(
      tweet,
      conversation.guestToken || '',
      language
    );
    apiTweet.translation = {
      text: translateAPI?.translation || '',
      source_lang: translateAPI?.sourceLanguage || '',
      target_lang: translateAPI?.destinationLanguage || ''
    };
  }

  return apiTweet;
};

export const statusAPI = async (
  event: FetchEvent,
  status: string,
  language: string
): Promise<APIResponse> => {
  const conversation = await fetchUsingGuest(status, event);
  const tweet = conversation?.globalObjects?.tweets?.[status] || {};

  console.log('users', JSON.stringify(conversation?.globalObjects?.users));
  console.log('user_id_str', tweet.user_id_str);

  /* Fallback for if Tweet did not load */
  if (typeof tweet.full_text === 'undefined') {
    console.log('Invalid status, got tweet ', tweet, ' conversation ', conversation);

    /* We've got timeline instructions, so the Tweet is probably private */
    if (conversation.timeline?.instructions?.length > 0) {
      return { code: 401, message: 'PRIVATE_TWEET' };
    }

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

  let response: APIResponse = { code: 200, message: 'OK' } as APIResponse;
  let apiTweet: APITweet = (await populateTweetProperties(
    tweet,
    conversation,
    language
  )) as APITweet;

  let quoteTweet =
    conversation.globalObjects?.tweets?.[tweet.quoted_status_id_str || '0'] || null;
  if (quoteTweet) {
    apiTweet.quote = (await populateTweetProperties(
      quoteTweet,
      conversation,
      language
    )) as APITweet;
  }

  response.tweet = apiTweet;
  return response;
};

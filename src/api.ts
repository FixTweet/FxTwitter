import { renderCard } from './card';
import { Constants } from './constants';
import { fetchUsingGuest } from './fetch';
import { linkFixer } from './linkFixer';
import { handleMosaic } from './mosaic';
import { colorFromPalette } from './palette';
import { translateTweet } from './translate';
import { unescapeText } from './utils';

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
    const bestVariant = media.video_info?.variants?.reduce?.((a, b) =>
      (a.bitrate ?? 0) > (b.bitrate ?? 0) ? a : b
    );
    return {
      url: bestVariant?.url || '',
      thumbnail_url: media.media_url_https,
      duration: (media.video_info?.duration_millis || 0) / 1000,
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

  apiTweet.url = `${Constants.TWITTER_ROOT}/${screenName}/status/${tweet.id_str}`;
  apiTweet.id = tweet.id_str;
  apiTweet.text = unescapeText(linkFixer(tweet, tweet.full_text));
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
          // @ts-expect-error
          WARNING:
            'video is deprecated and will be removed. Please use videos[0] instead.',
          ...mediaObject
        };
      }
    }
  });

  if (mediaList[0]?.ext_media_color?.palette) {
    apiTweet.color = colorFromPalette(mediaList[0].ext_media_color.palette);
  }

  if ((apiTweet.media?.photos?.length || 0) > 1) {
    const mosaic = await handleMosaic(apiTweet.media?.photos || [], tweet.id_str);
    if (typeof apiTweet.media !== 'undefined' && mosaic !== null) {
      apiTweet.media.mosaic = mosaic;
    }
  }

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

  console.log('language', language);

  /* If a language is specified, let's try translating it! */
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

export const statusAPI = async (
  status: string,
  language: string | undefined
): Promise<APIResponse> => {
  const conversation = await fetchUsingGuest(status);
  const tweet = conversation?.globalObjects?.tweets?.[status] || {};

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

  const response: APIResponse = { code: 200, message: 'OK' } as APIResponse;
  const apiTweet: APITweet = (await populateTweetProperties(
    tweet,
    conversation,
    language
  )) as APITweet;

  const quoteTweet =
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

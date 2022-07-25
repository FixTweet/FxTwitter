import { renderCard } from './card';
import { fetchUsingGuest } from './fetch';
import { linkFixer } from './linkFixer';
import { colorFromPalette } from './palette';
import { translateTweet } from './translate';

const populateTweetProperties = async (
  tweet: TweetPartial,
  conversation: TimelineBlobPartial,
  language: string = 'en'
): Promise<APITweet> => {
  let apiTweet = {} as APITweet;

  const user = tweet.user;
  const screenName = user?.screen_name || '';
  const name = user?.name || '';

  apiTweet.text = linkFixer(tweet, tweet.full_text);
  apiTweet.author = {
    name: name,
    screen_name: screenName,
    avatar_url: user?.profile_image_url_https.replace('_normal', '_200x200') || '',
    avatar_color: (apiTweet.palette = colorFromPalette(
      tweet.user?.profile_image_extensions_media_color?.palette || []
    )),
    banner_url: user?.profile_banner_url || ''
  };
  apiTweet.replies = tweet.reply_count;
  apiTweet.retweets = tweet.retweet_count;
  apiTweet.likes = tweet.favorite_count;
  apiTweet.palette = colorFromPalette(
    tweet.user?.profile_image_extensions_media_color?.palette || []
  );

  if (tweet.card) {
    let card = await renderCard(tweet.card);
    if (card.external_media) {
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
  /* With v2 conversation API we re-add the user object ot the tweet because
     Twitter stores it separately in the conversation API. This is to consolidate
     it in case a user appears multiple times in a thread. */
  tweet.user = conversation?.globalObjects?.users?.[tweet.user_id_str] || {};

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

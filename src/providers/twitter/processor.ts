import { renderCard } from '../../helpers/card';
import { Constants } from '../../constants';
import { linkFixer } from '../../helpers/linkFixer';
import { handleMosaic } from '../../helpers/mosaic';
// import { translateTweet } from '../../helpers/translate';
import { unescapeText } from '../../helpers/utils';
import { processMedia } from '../../helpers/media';
import { convertToApiUser } from '../../api/user';
import { translateTweet } from '../../helpers/translate';

export const buildAPITweet = async (
  tweet: GraphQLTweet,
  language: string | undefined,
  threadPiece = false,
  legacyAPI = false
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<APITweet | null> => {
  const apiTweet = {} as APITweet;

  /* Sometimes, Twitter returns a different kind of Tweet type called 'TweetWithVisibilityResults'.
     It has slightly different attributes from the regular 'Tweet' type. We fix that up here. */

  if (typeof tweet.core === 'undefined' && typeof tweet.result !== 'undefined') {
    tweet = tweet.result;
  }

  if (typeof tweet.core === 'undefined' && typeof tweet.tweet?.core !== 'undefined') {
    tweet.core = tweet.tweet.core;
  }

  if (typeof tweet.legacy === 'undefined' && typeof tweet.tweet?.legacy !== 'undefined') {
    tweet.legacy = tweet.tweet?.legacy;
  }

  if (typeof tweet.views === 'undefined' && typeof tweet?.tweet?.views !== 'undefined') {
    tweet.views = tweet?.tweet?.views;
  }

  if (typeof tweet.core === 'undefined') {
    console.log('Tweet still not valid', tweet);
    return null;
  }

  const graphQLUser = tweet.core.user_results.result;
  const apiUser = convertToApiUser(graphQLUser);

  /* Sometimes, `rest_id` is undefined for some reason. Inconsistent behavior. See: https://github.com/FixTweet/FixTweet/issues/416 */
  const id = tweet.rest_id ?? tweet.legacy.id_str;

  /* Populating a lot of the basics */
  apiTweet.url = `${Constants.TWITTER_ROOT}/${apiUser.screen_name}/status/${id}`;
  apiTweet.id = id;
  apiTweet.text = unescapeText(linkFixer(tweet.legacy.entities?.urls, tweet.legacy.full_text || ''));
  if (!threadPiece) {
    apiTweet.author = {
      id: apiUser.id,
      name: apiUser.name,
      screen_name: apiUser.screen_name,
      global_screen_name: apiUser.global_screen_name,
      avatar_url: apiUser.avatar_url?.replace?.('_normal', '_200x200') ?? null,
      banner_url: apiUser.banner_url ?? null,
      description: apiUser.description ?? null,
      location: apiUser.location ?? null,
      url: apiUser.url ?? null,
      followers: apiUser.followers,
      following: apiUser.following,
      joined: apiUser.joined,
      posts: apiUser.tweets,
      likes: apiUser.likes,
      protected: apiUser.protected,
      birthday: apiUser.birthday,
      website: apiUser.website
    };
  }
  apiTweet.replies = tweet.legacy.reply_count;
  if (legacyAPI) {
    // @ts-expect-error Use retweets for legacy API
    apiTweet.retweets = tweet.legacy.retweet_count;
  } else {
    apiTweet.reposts = tweet.legacy.retweet_count;
  }
  apiTweet.likes = tweet.legacy.favorite_count;
  apiTweet.embed_card = 'tweet';
  apiTweet.created_at = tweet.legacy.created_at;
  apiTweet.created_timestamp = new Date(tweet.legacy.created_at).getTime() / 1000;

  apiTweet.possibly_sensitive = tweet.legacy.possibly_sensitive;

  if (tweet.views.state === 'EnabledWithCount') {
    apiTweet.views = parseInt(tweet.views.count || '0') ?? null;
  } else {
    apiTweet.views = null;
  }
  console.log('note_tweet', JSON.stringify(tweet.note_tweet));
  const noteTweetText = tweet.note_tweet?.note_tweet_results?.result?.text;

  if (noteTweetText) {
    tweet.legacy.entities.urls = tweet.note_tweet?.note_tweet_results?.result?.entity_set.urls;
    tweet.legacy.entities.hashtags =
      tweet.note_tweet?.note_tweet_results?.result?.entity_set.hashtags;
    tweet.legacy.entities.symbols =
      tweet.note_tweet?.note_tweet_results?.result?.entity_set.symbols;

    console.log('We meet the conditions to use new note tweets');
    apiTweet.text = unescapeText(linkFixer(tweet.legacy.entities.urls, noteTweetText));
    apiTweet.is_note_tweet = true;
  } else {
    apiTweet.is_note_tweet = false;
  }

  if (tweet.legacy.lang !== 'unk') {
    apiTweet.lang = tweet.legacy.lang;
  } else {
    apiTweet.lang = null;
  }

  if (legacyAPI) {
    apiTweet.replying_to = tweet.legacy?.in_reply_to_screen_name || null;
    apiTweet.replying_to_status = tweet.legacy?.in_reply_to_status_id_str || null;
  } else if (tweet.legacy.in_reply_to_screen_name) {
    apiTweet.reply_of = {
      screen_name: tweet.legacy.in_reply_to_screen_name || null,
      post: tweet.legacy.in_reply_to_status_id_str || null
    };
  } else {
    apiTweet.reply_of = null;
  }
  
  apiTweet.media = {
    all: [],
    photos: [],
    videos: [],
  };
  
  /* We found a quote tweet, let's process that too */
  const quoteTweet = tweet.quoted_status_result;
  if (quoteTweet) {
    apiTweet.quote = (await buildAPITweet(quoteTweet, language)) as APITweet;
    /* Only override the embed_card if it's a basic tweet, since media always takes precedence  */
    if (apiTweet.embed_card === 'tweet' && apiTweet.quote !== null) {
      apiTweet.embed_card = apiTweet.quote.embed_card;
    }
  }

  const mediaList = Array.from(
    tweet.legacy.extended_entities?.media || tweet.legacy.entities?.media || []
  );

  // console.log('tweet', JSON.stringify(tweet));

  /* Populate this Tweet's media */
  mediaList.forEach(media => {
    const mediaObject = processMedia(media);
    if (mediaObject) {
      apiTweet.media?.all?.push(mediaObject);
      if (mediaObject.type === 'photo') {
        apiTweet.embed_card = 'summary_large_image';
        apiTweet.media?.photos?.push(mediaObject);
      } else if (mediaObject.type === 'video' || mediaObject.type === 'gif') {
        apiTweet.embed_card = 'player';
        apiTweet.media?.videos?.push(mediaObject);
      } else {
        console.log('Unknown media type', mediaObject.type);
      }
    }
  });

  /* Grab color palette data */
  /*
  if (mediaList[0]?.ext_media_color?.palette) {
    apiTweet.color = colorFromPalette(mediaList[0].ext_media_color.palette);
  }
  */

  /* Handle photos and mosaic if available */
  if ((apiTweet?.media?.photos?.length || 0) > 1 && !threadPiece) {
    const mosaic = await handleMosaic(apiTweet.media?.photos || [], id);
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
      apiTweet.media = apiTweet.media ?? {};
      apiTweet.media.external = card.external_media;
    }
    if (card.poll) {
      apiTweet.poll = card.poll;
    }
  }

  if (apiTweet.media?.videos && apiTweet.embed_card !== 'player') {
    apiTweet.embed_card = 'player';
  }

  /* If a language is specified in API or by user, let's try translating it! */
  if (typeof language === 'string' && language.length === 2 && language !== tweet.legacy.lang) {
    console.log(`Attempting to translate Tweet to ${language}...`);
    const translateAPI = await translateTweet(tweet, '', language);
    if (translateAPI !== null && translateAPI?.translation) {
      apiTweet.translation = {
        text: unescapeText(linkFixer(tweet.legacy?.entities?.urls, translateAPI?.translation || '')),
        source_lang: translateAPI?.sourceLanguage || '',
        target_lang: translateAPI?.destinationLanguage || '',
        source_lang_en: translateAPI?.localizedSourceLanguage || ''
      };
    }
  }

  return apiTweet;
};
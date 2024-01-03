import { renderCard } from '../../helpers/card';
import { Constants } from '../../constants';
import { linkFixer } from '../../helpers/linkFixer';
import { handleMosaic } from '../../helpers/mosaic';
import { unescapeText } from '../../helpers/utils';
import { processMedia } from '../../helpers/media';
import { convertToApiUser } from './profile';
import { translateStatus } from '../../helpers/translate';
import { Context } from 'hono';

export const buildAPITwitterStatus = async (
  c: Context,
  status: GraphQLTwitterStatus,
  language: string | undefined,
  threadPiece = false,
  legacyAPI = false
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<APITwitterStatus | FetchResults | null> => {
  const apiStatus = {} as APITwitterStatus;

  /* Sometimes, Twitter returns a different kind of type called 'TweetWithVisibilityResults'.
     It has slightly different attributes from the regular 'Tweet' type. We fix that up here. */

  if (typeof status.core === 'undefined' && typeof status.result !== 'undefined') {
    status = status.result;
  }

  if (typeof status.core === 'undefined' && typeof status.tweet?.core !== 'undefined') {
    status.core = status.tweet.core;
  }

  if (typeof status.legacy === 'undefined' && typeof status.tweet?.legacy !== 'undefined') {
    status.legacy = status.tweet?.legacy;
  }

  if (typeof status.views === 'undefined' && typeof status?.tweet?.views !== 'undefined') {
    status.views = status?.tweet?.views;
  }

  if (typeof status.core === 'undefined') {
    console.log('Status still not valid', status);
    if (status.__typename === 'TweetUnavailable' && status.reason === 'Protected') {
      return { status: 401 };
    } else {
      return { status: 404 };
    }
  }

  const graphQLUser = status.core.user_results.result;
  const apiUser = convertToApiUser(graphQLUser);

  /* Sometimes, `rest_id` is undefined for some reason. Inconsistent behavior. See: https://github.com/FixTweet/FxTwitter/issues/416 */
  const id = status.rest_id ?? status.legacy.id_str;

  /* Populating a lot of the basics */
  apiStatus.url = `${Constants.TWITTER_ROOT}/${apiUser.screen_name}/status/${id}`;
  apiStatus.id = id;
  apiStatus.text = unescapeText(
    linkFixer(status.legacy.entities?.urls, status.legacy.full_text || '')
  );
  if (!threadPiece) {
    apiStatus.author = {
      id: apiUser.id,
      name: apiUser.name,
      screen_name: apiUser.screen_name,
      avatar_url: apiUser.avatar_url?.replace?.('_normal', '_200x200') ?? null,
      banner_url: apiUser.banner_url,
      description: apiUser.description,
      location: apiUser.location,
      url: apiUser.url,
      followers: apiUser.followers,
      following: apiUser.following,
      joined: apiUser.joined,
      statuses: apiUser.statuses,
      likes: apiUser.likes,
      protected: apiUser.protected,
      birthday: apiUser.birthday,
      website: apiUser.website
    };
  }
  apiStatus.replies = status.legacy.reply_count;
  if (legacyAPI) {
    // @ts-expect-error Use retweets for legacy API
    apiStatus.retweets = status.legacy.retweet_count;

    // @ts-expect-error `tweets` is only part of legacy API
    apiStatus.author.tweets = apiStatus.author.statuses;
    // @ts-expect-error Part of legacy API that we no longer are able to track
    apiStatus.author.avatar_color = null;
    // @ts-expect-error Use retweets for legacy API
    delete apiStatus.reposts;
    // @ts-expect-error Use tweets and not posts for legacy API
    delete apiStatus.author.statuses;
    delete apiStatus.author.global_screen_name;
  } else {
    apiStatus.reposts = status.legacy.retweet_count;
    apiStatus.author.global_screen_name = apiUser.global_screen_name;
  }
  apiStatus.likes = status.legacy.favorite_count;
  apiStatus.embed_card = 'tweet';
  apiStatus.created_at = status.legacy.created_at;
  apiStatus.created_timestamp = new Date(status.legacy.created_at).getTime() / 1000;

  apiStatus.possibly_sensitive = status.legacy.possibly_sensitive;

  if (status.views.state === 'EnabledWithCount') {
    apiStatus.views = parseInt(status.views.count || '0') ?? null;
  } else {
    apiStatus.views = null;
  }
  console.log('note_tweet', JSON.stringify(status.note_tweet));
  const noteTweetText = status.note_tweet?.note_tweet_results?.result?.text;

  if (noteTweetText) {
    status.legacy.entities.urls = status.note_tweet?.note_tweet_results?.result?.entity_set.urls;
    status.legacy.entities.hashtags =
      status.note_tweet?.note_tweet_results?.result?.entity_set.hashtags;
    status.legacy.entities.symbols =
      status.note_tweet?.note_tweet_results?.result?.entity_set.symbols;

    console.log('We meet the conditions to use new note tweets');
    apiStatus.text = unescapeText(linkFixer(status.legacy.entities.urls, noteTweetText));
    apiStatus.is_note_tweet = true;
  } else {
    apiStatus.is_note_tweet = false;
  }

  if (status.legacy.lang !== 'unk') {
    apiStatus.lang = status.legacy.lang;
  } else {
    apiStatus.lang = null;
  }

  if (legacyAPI) {
    // @ts-expect-error Use replying_to string for legacy API
    apiStatus.replying_to = status.legacy?.in_reply_to_screen_name || null;
    // @ts-expect-error Use replying_to_status string for legacy API
    apiStatus.replying_to_status = status.legacy?.in_reply_to_status_id_str || null;
  } else if (status.legacy.in_reply_to_screen_name) {
    apiStatus.replying_to = {
      screen_name: status.legacy.in_reply_to_screen_name || null,
      post: status.legacy.in_reply_to_status_id_str || null
    };
  } else {
    apiStatus.replying_to = null;
  }

  apiStatus.media = {};

  /* We found a quote, let's process that too */
  const quote = status.quoted_status_result;
  if (quote) {
    const buildQuote = await buildAPITwitterStatus(c, quote, language, threadPiece, legacyAPI);
    if ((buildQuote as FetchResults).status) {
      apiStatus.quote = undefined;
    } else {
      apiStatus.quote = buildQuote as APITwitterStatus;
    }

    /* Only override the embed_card if it's a basic status, since media always takes precedence  */
    if (apiStatus.embed_card === 'tweet' && typeof apiStatus.quote !== 'undefined') {
      apiStatus.embed_card = apiStatus.quote.embed_card;
    }
  }

  const mediaList = Array.from(
    status.legacy.extended_entities?.media || status.legacy.entities?.media || []
  );

  // console.log('status', JSON.stringify(status));

  /* Populate status media */
  mediaList.forEach(media => {
    const mediaObject = processMedia(media);
    if (mediaObject) {
      apiStatus.media.all = apiStatus.media?.all ?? [];
      apiStatus.media?.all?.push(mediaObject);
      if (mediaObject.type === 'photo') {
        apiStatus.embed_card = 'summary_large_image';
        apiStatus.media.photos = apiStatus.media?.photos ?? [];
        apiStatus.media.photos?.push(mediaObject);
      } else if (mediaObject.type === 'video' || mediaObject.type === 'gif') {
        apiStatus.embed_card = 'player';
        apiStatus.media.videos = apiStatus.media?.videos ?? [];
        apiStatus.media.videos?.push(mediaObject);
      } else {
        console.log('Unknown media type', mediaObject.type);
      }
    }
  });

  /* Grab color palette data */
  /*
  if (mediaList[0]?.ext_media_color?.palette) {
    apiStatus.color = colorFromPalette(mediaList[0].ext_media_color.palette);
  }
  */

  /* Handle photos and mosaic if available */
  if ((apiStatus?.media.photos?.length || 0) > 1 && !threadPiece) {
    const mosaic = await handleMosaic(apiStatus.media?.photos || [], id);
    if (typeof apiStatus.media !== 'undefined' && mosaic !== null) {
      apiStatus.media.mosaic = mosaic;
    }
  }

  // Add source but remove the link HTML tag
  if (status.source) {
    apiStatus.source = (status.source || '').replace(
      /<a href="(.+?)" rel="nofollow">(.+?)<\/a>/,
      '$2'
    );
  }

  /* Populate a Twitter card */

  if (status.card) {
    const card = renderCard(status.card);
    if (card.external_media) {
      apiStatus.embed_card = 'player';
      apiStatus.media.external = card.external_media;
      if (apiStatus.media.external.url.match('https://www.youtube.com/embed/')) {
        /* Add YouTube thumbnail URL */
        apiStatus.media.external.thumbnail_url = `https://img.youtube.com/vi/${apiStatus.media.external.url.replace(
          'https://www.youtube.com/embed/',
          ''
        )}/maxresdefault.jpg`;
      }
    }
    if (card.poll) {
      apiStatus.poll = card.poll;
    }
  } else {
    /* Determine if the status contains a YouTube link (either youtube.com or youtu.be) so we can include it */
    const youtubeIdRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([^\s&]+)/;
    const matches = apiStatus.text.match(youtubeIdRegex);

    const youtubeId = matches ? matches[4] : null;

    if (youtubeId) {
      apiStatus.media.external = {
        type: 'video',
        url: `https://www.youtube.com/embed/${youtubeId}`,
        thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        width: 1280,
        height: 720
      };

      apiStatus.embed_card = 'player';
    }
  }

  if (
    apiStatus.media?.videos &&
    apiStatus.media?.videos.length > 0 &&
    apiStatus.embed_card !== 'player'
  ) {
    apiStatus.embed_card = 'player';
  }

  console.log('language?', language);

  /* If a language is specified in API or by user, let's try translating it! */
  if (typeof language === 'string' && (language.length === 2 || language.length === 5) && language !== status.legacy.lang) {
    console.log(`Attempting to translate status to ${language}...`);
    const translateAPI = await translateStatus(status, '', language, c);
    if (translateAPI !== null && translateAPI?.translation) {
      apiStatus.translation = {
        text: unescapeText(
          linkFixer(status.legacy?.entities?.urls, translateAPI?.translation || '')
        ),
        source_lang: translateAPI?.sourceLanguage || '',
        target_lang: translateAPI?.destinationLanguage || '',
        source_lang_en: translateAPI?.localizedSourceLanguage || ''
      };
    }
  }

  if (legacyAPI) {
    // @ts-expect-error Use twitter_card for legacy API
    apiStatus.twitter_card = apiStatus.embed_card;
    // @ts-expect-error Part of legacy API that we no longer are able to track
    apiStatus.color = null;
    // @ts-expect-error Use twitter_card for legacy API
    delete apiStatus.embed_card;
    if ((apiStatus.media.all?.length ?? 0) < 1 && !apiStatus.media.external) {
      // @ts-expect-error media is not required in legacy API if empty
      delete apiStatus.media;
    }
  }

  return apiStatus;
};

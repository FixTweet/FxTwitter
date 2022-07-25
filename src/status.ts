import { Constants } from './constants';
import { fetchUsingGuest } from './fetch';
import { linkFixer } from './linkFixer';
import { colorFromPalette } from './palette';
import { renderCard } from './card';
import { handleQuote } from './quote';
import { sanitizeText } from './utils';
import { Strings } from './strings';
import { handleMosaic } from './mosaic';
import { translateTweet } from './translate';
import { getAuthorText } from './author';
import { statueAPI } from './api';

export const returnError = (error: string): StatusResponse => {
  return {
    text: Strings.BASE_HTML.format({
      lang: '',
      headers: [
        `<meta content="${Constants.BRANDING_NAME}" property="og:title"/>`,
        `<meta content="${error}" property="og:description"/>`
      ].join('')
    })
  };
};

export const handleStatus = async (
  event: FetchEvent,
  status: string,
  mediaNumber?: number,
  userAgent?: string,
  flags?: InputFlags,
  language?: string
): Promise<StatusResponse> => {
  console.log('Direct?', flags?.direct);

  let api = await statueAPI(event, status, language || 'en');

  switch(api.code) {
    case 401:
      return returnError(Strings.ERROR_PRIVATE);
    case 404:
      return returnError(Strings.ERROR_TWEET_NOT_FOUND);
    case 500:
      return returnError(Strings.ERROR_API_FAIL);
  }

  let headers: string[] = [];

  let redirectMedia = '';
  let engagementText = '';

  if (api?.tweet?.translation) {
    
  }
  

  let mediaList = Array.from(
    tweet.extended_entities?.media || tweet.entities?.media || []
  );

  let authorText = getAuthorText(tweet) || Strings.DEFAULT_AUTHOR_TEXT;

  // engagementText has less spacing than authorText
  engagementText = authorText.replace(/    /g, ' ');

  text = linkFixer(tweet, text);

  /* Cards are used by polls and non-Twitter video embeds */
  if (tweet.card) {
    let cardRender = await renderCard(tweet.card, headers, userAgent);

    if (cardRender === 'EMBED_CARD') {
      authorText = encodeURIComponent(text);
    } else {
      text += cardRender;
    }
  }

  /* Trying to uncover a quote tweet referenced by this tweet */
  let quoteTweetMaybe =
    conversation.globalObjects?.tweets?.[tweet.quoted_status_id_str || '0'] || null;

  if (quoteTweetMaybe) {
    /* Populate quote tweet user from globalObjects */
    quoteTweetMaybe.user =
      conversation?.globalObjects?.users?.[quoteTweetMaybe.user_id_str] || {};
    const quoteText = handleQuote(quoteTweetMaybe);

    if (quoteText) {
      console.log('quoteText', quoteText);

      text += `\n${quoteText}`;
    }

    /* This code handles checking the quote tweet for media.
       We'll embed a quote tweet's media if the linked tweet does not have any. */
    if (
      mediaList.length === 0 &&
      (quoteTweetMaybe.extended_entities?.media?.length ||
        quoteTweetMaybe.entities?.media?.length ||
        0) > 0
    ) {
      console.log(
        `No media in main tweet, let's try embedding the quote tweet's media instead!`
      );
      mediaList = Array.from(
        quoteTweetMaybe.extended_entities?.media || quoteTweetMaybe.entities?.media || []
      );

      console.log('updated mediaList', mediaList);
    }
  }

  /* No media was found, but that's OK because we can still enrichen the Tweet
     with a profile picture and color-matched embed in Discord! */
  if (mediaList.length === 0) {
    console.log('No media');
    let palette = user?.profile_image_extensions_media_color?.palette;
    let colorOverride: string = Constants.DEFAULT_COLOR;

    if (palette) {
      colorOverride = colorFromPalette(palette);
    }

    headers.push(
      `<meta content="${colorOverride}" property="theme-color"/>`,
      `<meta property="og:site_name" content="${Constants.BRANDING_NAME}"/>`,
      // Use a slightly higher resolution image for profile pics
      `<meta property="og:image" content="${user?.profile_image_url_https.replace(
        '_normal',
        '_200x200'
      )}"/>`,
      `<meta name="twitter:card" content="tweet"/>`,
      `<meta name="twitter:title" content="${name} (@${screenName})"/>`,
      `<meta name="twitter:image" content="0"/>`,
      `<meta name="twitter:creator" content="@${name}"/>`,
      `<meta content="${sanitizeText(text)}" property="og:description"/>`
    );
  } else {
    console.log('Media available');
    let firstMedia = mediaList[0];

    /* Try grabbing media color palette */
    let palette = firstMedia?.ext_media_color?.palette;
    let colorOverride: string = Constants.DEFAULT_COLOR;
    let pushedCardType = false;

    if (palette) {
      colorOverride = colorFromPalette(palette);
    }

    /* theme-color is used by discord to style the embed.

       We take full advantage of that!*/
    headers.push(`<meta content="${colorOverride}" property="theme-color"/>`);

    /* Inline helper function for handling media */
    const processMedia = (media: TweetMedia) => {
      if (media.type === 'photo') {
        if (flags?.direct && typeof media.media_url_https === 'string') {
          redirectMedia = media.media_url_https;
          return;
        }

        headers.push(
          `<meta name="twitter:image" content="${media.media_url_https}"/>`,
          `<meta property="og:image" content="${media.media_url_https}"/>`
        );

        if (media.original_info?.width && media.original_info?.height) {
          headers.push(
            `<meta name="twitter:image:width" content="${media.original_info.width}"/>`,
            `<meta name="twitter:image:height" content="${media.original_info.height}"/>`,
            `<meta name="og:image:width" content="${media.original_info.width}"/>`,
            `<meta name="og:image:height" content="${media.original_info.height}"/>`
          );
        }

        if (!pushedCardType) {
          headers.push(`<meta name="twitter:card" content="summary_large_image"/>`);
          pushedCardType = true;
        }
      } else if (media.type === 'video' || media.type === 'animated_gif') {
        // Find the variant with the highest bitrate
        let bestVariant = media.video_info?.variants?.reduce?.((a, b) =>
          (a.bitrate ?? 0) > (b.bitrate ?? 0) ? a : b
        );

        if (flags?.direct && bestVariant?.url) {
          console.log(`Redirecting to ${bestVariant.url}`);
          redirectMedia = bestVariant.url;
          return;
        }

        /* This is for the video thumbnail */
        headers.push(`<meta name="twitter:image" content="${media.media_url_https}"/>`);

        /* On Discord we have to use the author field in order to get the tweet text
           to display on videos. This length is limited, however, and if there is too
           much text Discord will refuse to display it at all, so we trim down as much
           as the client will display. */
        if (userAgent && userAgent?.indexOf?.('Discord') > -1) {
          text = text.substr(0, 179);
        }

        authorText = encodeURIComponent(text);

        headers.push(
          `<meta name="twitter:card" content="player"/>`,
          `<meta name="twitter:player:stream" content="${bestVariant?.url}"/>`,
          `<meta name="twitter:player:stream:content_type" content="${bestVariant?.content_type}"/>`,
          `<meta name="twitter:player:height" content="${media.original_info.height}"/>`,
          `<meta name="twitter:player:width" content="${media.original_info.width}"/>`,
          `<meta name="og:video" content="${bestVariant?.url}"/>`,
          `<meta name="og:video:secure_url" content="${bestVariant?.url}"/>`,
          `<meta name="og:video:height" content="${media.original_info.height}"/>`,
          `<meta name="og:video:width" content="${media.original_info.width}"/>`,
          `<meta name="og:video:type" content="${bestVariant?.content_type}"/>`
        );
      }
    };

    let actualMediaNumber = 0;
    let renderedMosaic = false;

    console.log('mediaNumber', mediaNumber);
    console.log('mediaList length', mediaList.length);

    /* You can specify a specific photo in the URL and we'll pull the correct one,
       otherwise it falls back to first */
    if (
      typeof mediaNumber !== 'undefined' &&
      typeof mediaList[mediaNumber - 1] !== 'undefined'
    ) {
      console.log(`Media ${mediaNumber} found`);
      actualMediaNumber = mediaNumber - 1;
      processMedia(mediaList[actualMediaNumber]);
    } else if (mediaList.length === 1) {
      console.log(`Media ${mediaNumber} not found, ${mediaList.length} total`);
      processMedia(firstMedia);
    } else if (mediaList.length > 1) {
      console.log('Handling mosaic');
      processMedia(await handleMosaic(mediaList, userAgent || ''));
      renderedMosaic = true;
    }

    if (flags?.direct && redirectMedia) {
      let response = Response.redirect(redirectMedia, 302);
      console.log(response);
      return { response: response };
    }

    if (mediaList.length > 1 && !renderedMosaic) {
      let photoCounter = Strings.PHOTO_COUNT.format({
        number: actualMediaNumber + 1,
        total: mediaList.length
      });

      authorText =
        authorText === Strings.DEFAULT_AUTHOR_TEXT
          ? photoCounter
          : `${authorText}   ―   ${photoCounter}`;

      let siteName = `${Constants.BRANDING_NAME} - ${photoCounter}`;

      if (engagementText) {
        siteName = `${Constants.BRANDING_NAME} - ${engagementText} - ${photoCounter}`;
      }

      headers.push(`<meta property="og:site_name" content="${siteName}"/>`);
    } else {
      headers.push(
        `<meta property="og:site_name" content="${Constants.BRANDING_NAME}"/>`
      );
    }

    headers.push(
      `<meta content="${name} (@${screenName})" property="og:title"/>`,
      `<meta content="${sanitizeText(text)}" property="og:description"/>`
    );
  }

  /* Special reply handling if authorText is not overriden */
  if (tweet.in_reply_to_screen_name && authorText === 'Twitter') {
    authorText = `↪ Replying to @${tweet.in_reply_to_screen_name}`;
  }

  /* The additional oembed is pulled by Discord to enable improved embeds.
     Telegram does not use this. */
  headers.push(
    `<link rel="alternate" href="${Constants.HOST_URL}/owoembed?text=${encodeURIComponent(
      authorText
    )}&status=${encodeURIComponent(status)}&author=${encodeURIComponent(
      user?.screen_name || ''
    )}" type="application/json+oembed" title="${name}">`
  );

  /* When dealing with a Tweet of unknown lang, fall back to en  */
  let lang = tweet.lang === 'unk' ? 'en' : tweet.lang || 'en';

  return {
    text: Strings.BASE_HTML.format({
      lang: `lang="${lang}"`,
      headers: headers.join('')
    })
  };
};

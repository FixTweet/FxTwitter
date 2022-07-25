import { Constants } from './constants';
import { handleQuote } from './quote';
import { sanitizeText } from './utils';
import { Strings } from './strings';
import { getAuthorText } from './author';
import { statusAPI } from './api';

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

  let api = await statusAPI(event, status, language || 'en');
  const tweet = api?.tweet as APITweet;

  if (flags?.api) {
    return {
      response: new Response(JSON.stringify(api), {
        headers: { ...Constants.RESPONSE_HEADERS, 'content-type': 'application/json' },
        status: api.code
      })
    };
  }

  switch (api.code) {
    case 401:
      return returnError(Strings.ERROR_PRIVATE);
    case 404:
      return returnError(Strings.ERROR_TWEET_NOT_FOUND);
    case 500:
      return returnError(Strings.ERROR_API_FAIL);
  }

  if (flags?.direct) {
    if (tweet.media) {
      let redirectUrl: string | null = null;
      if (tweet.media.video) {
        redirectUrl = tweet.media.video.url;
      } else if (tweet.media.photos) {
        redirectUrl = (tweet.media.photos[mediaNumber || 0] || tweet.media.photos[0]).url;
      }
      if (redirectUrl) {
        return { response: Response.redirect(redirectUrl, 302) };
      }
    }
  }

  /* Use quote media if there is no media */
  if (!tweet.media && tweet.quote?.media) {
    tweet.media = tweet.quote.media;
    tweet.twitter_card = 'summary_large_image';
  }

  let authorText = getAuthorText(tweet) || Strings.DEFAULT_AUTHOR_TEXT;
  let engagementText = authorText.replace(/    /g, ' ');

  let headers: string[] = [
    `<meta content="${tweet.color}" property="theme-color"/>`,
    `<meta name="twitter:card" content="${tweet.twitter_card}"/>`,
    `<meta name="twitter:site" content="@${tweet.author.screen_name}"/>`,
    `<meta name="twitter:creator" content="@${tweet.author.screen_name}"/>`,
    `<meta name="twitter:title" content="${tweet.author.name} (@${tweet.author.screen_name})"/>`
  ];

  /* Video renderer */
  if (tweet.media?.video) {
    authorText = encodeURIComponent(tweet.text || '');

    const { video } = tweet.media;

    headers.push(
      `<meta name="twitter:player:stream:content_type" content="${video.format}"/>`,
      `<meta name="twitter:player:height" content="${video.height}"/>`,
      `<meta name="twitter:player:width" content="${video.width}"/>`,
      `<meta name="og:video" content="${video.url}"/>`,
      `<meta name="og:video:secure_url" content="${video.url}"/>`,
      `<meta name="og:video:height" content="${video.height}"/>`,
      `<meta name="og:video:width" content="${video.width}"/>`,
      `<meta name="og:video:type" content="${video.format}"/>`,
      `<meta name="twitter:image" content="${video.thumbnail_url}"/>`
    );
  }

  /* Photo renderer */
  if (tweet.media?.photos) {
    const { photos } = tweet.media;
    let photo = photos[(mediaNumber || 1) - 1];

    if (
      typeof mediaNumber !== 'number' &&
      tweet.media.mosaic &&
      userAgent?.indexOf('Telegram') === -1
    ) {
      photo = {
        url:
          userAgent?.indexOf('Telegram') !== -1
            ? tweet.media.mosaic.formats.webp
            : tweet.media.mosaic.formats.jpeg,
        width: tweet.media.mosaic.width,
        height: tweet.media.mosaic.height,
        type: 'photo'
      };
    } else if (photos.length > 1) {
      let photoCounter = Strings.PHOTO_COUNT.format({
        number: photos.indexOf(photo) + 1,
        total: photos.length
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
    }

    headers.push(
      `<meta name="twitter:image" content="${photo.url}"/>`,
      `<meta name="twitter:image:width" content="${photo.width}"/>`,
      `<meta name="twitter:image:height" content="${photo.height}"/>`,
      `<meta name="og:image" content="${photo.url}"/>`,
      `<meta name="og:image:width" content="${photo.width}"/>`,
      `<meta name="og:image:height" content="${photo.height}"/>`
    );
  }

  /* External media renderer (i.e. YouTube) */
  if (tweet.media?.external) {
    const { external } = tweet.media;
    headers.push(
      `<meta name="twitter:player" content="${external.url}">`,
      `<meta name="twitter:player:width" content="${external.width}">`,
      `<meta name="twitter:player:height" content="${external.height}">`,
      `<meta property="og:type" content="video.other">`,
      `<meta property="og:video:url" content="${external.url}">`,
      `<meta property="og:video:secure_url" content="${external.url}">`,
      `<meta property="og:video:width" content="${external.width}">`,
      `<meta property="og:video:height" content="${external.height}">`
    );
  }

  let siteName = Constants.BRANDING_NAME;
  let newText = tweet.text;

  /* Poll renderer */
  if (tweet.poll) {
    const { poll } = tweet;
    let barLength = 34;
    let str = '';

    if (userAgent?.indexOf('Telegram') !== -1) {
      barLength = 24;
    }

    tweet.poll.choices.forEach(choice => {
      // render bar
      const bar = '█'.repeat((choice.percentage / 100) * barLength);
      str += `${bar}
${choice.label}  (${choice.percentage}%)
`;
    });

    str += `\n${poll.total_votes} votes · ${poll.time_left_en}`;

    newText += `\n\n${str}`;
  }

  if (!tweet.media?.video && !tweet.media?.photos) {
    headers.push(
      // Use a slightly higher resolution image for profile pics
      `<meta property="og:image" content="${tweet.author.avatar_url?.replace(
        '_normal',
        '_200x200'
      )}"/>`,
      `<meta name="twitter:image" content="0"/>`
    );
  }

  if (api.tweet?.translation) {
    const { translation } = api.tweet;

    let formatText =
      language === 'en'
        ? Strings.TRANSLATE_TEXT.format({
            language: translation.source_lang
          })
        : Strings.TRANSLATE_TEXT_INTL.format({
            source: translation.source_lang.toUpperCase(),
            destination: translation.target_lang.toUpperCase()
          });

    newText = `${translation.text}\n\n` + `${formatText}\n\n` + `${newText}`;
  }

  if (api.tweet?.quote) {
    const quoteText = handleQuote(api.tweet.quote);
    newText += `\n${quoteText}`;
  }

  headers.push(
    `<meta content="${tweet.author.name} (@${tweet.author.screen_name})" property="og:title"/>`,
    `<meta content="${sanitizeText(newText)}" property="og:description"/>`,
    `<meta content="${siteName}" property="og:site_name"/>`
  );

  /* Special reply handling if authorText is not overriden */
  if (tweet.replying_to && authorText === Strings.DEFAULT_AUTHOR_TEXT) {
    authorText = `↪ Replying to @${tweet.replying_to}`;
  }

  /* The additional oembed is pulled by Discord to enable improved embeds.
     Telegram does not use this. */
  headers.push(
    `<link rel="alternate" href="${Constants.HOST_URL}/owoembed?text=${encodeURIComponent(
      authorText
    )}&status=${encodeURIComponent(status)}&author=${encodeURIComponent(
      tweet.author?.screen_name || ''
    )}" type="application/json+oembed" title="${tweet.author.name}">`
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

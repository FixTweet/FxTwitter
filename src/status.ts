import { Constants } from './constants';
import { handleQuote } from './helpers/quote';
import { sanitizeText } from './helpers/utils';
import { Strings } from './strings';
import { getAuthorText } from './helpers/author';
import { statusAPI } from './api';

export const returnError = (error: string): StatusResponse => {
  return {
    text: Strings.BASE_HTML.format({
      lang: '',
      headers: [
        `<meta property="og:title" content="${Constants.BRANDING_NAME}"/>`,
        `<meta property="og:description" content="${error}"/>`
      ].join('')
    })
  };
};

/* Handler for Twitter statuses (Tweets).
   Like Twitter, we use the terminologies interchangably. */
export const handleStatus = async (
  status: string,
  mediaNumber?: number,
  userAgent?: string,
  flags?: InputFlags,
  language?: string,
  event?: FetchEvent
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Promise<StatusResponse> => {
  console.log('Direct?', flags?.direct);

  const api = await statusAPI(status, language, event as FetchEvent);
  const tweet = api?.tweet as APITweet;

  /* Catch this request if it's an API response */
  if (flags?.api) {
    return {
      response: new Response(JSON.stringify(api), {
        headers: { ...Constants.RESPONSE_HEADERS, ...Constants.API_RESPONSE_HEADERS },
        status: api.code
      })
    };
  }

  /* If there was any errors fetching the Tweet, we'll return it */
  switch (api.code) {
    case 401:
      return returnError(Strings.ERROR_PRIVATE);
    case 404:
      return returnError(Strings.ERROR_TWEET_NOT_FOUND);
    case 500:
      return returnError(Strings.ERROR_API_FAIL);
  }

  /* Catch direct media request (d.fxtwitter.com, or .mp4 / .jpg) */
  if (flags?.direct && tweet.media) {
    let redirectUrl: string | null = null;
    if (tweet.media.videos) {
      const { videos } = tweet.media;
      redirectUrl = (videos[(mediaNumber || 1) - 1] || videos[0]).url;
    } else if (tweet.media.photos) {
      const { photos } = tweet.media;
      redirectUrl = (photos[(mediaNumber || 1) - 1] || photos[0]).url;
    }
    if (redirectUrl) {
      return { response: Response.redirect(redirectUrl, 302) };
    }
  }

  /* Use quote media if there is no media in this Tweet */
  if (!tweet.media && tweet.quote?.media) {
    tweet.media = tweet.quote.media;
    tweet.twitter_card = tweet.quote.twitter_card;
  }

  /* At this point, we know we're going to have to create a
     regular embed because it's not an API or direct media request */

  let authorText = getAuthorText(tweet) || Strings.DEFAULT_AUTHOR_TEXT;
  const engagementText = authorText.replace(/ {4}/g, ' ');
  let siteName = Constants.BRANDING_NAME;
  let newText = tweet.text;

  /* Base headers included in all responses */
  const headers = [
    `<meta property="theme-color" content="${tweet.color}"/>`,
    `<meta property="twitter:card" content="${tweet.twitter_card}"/>`,
    `<meta property="twitter:site" content="@${tweet.author.screen_name}"/>`,
    `<meta property="twitter:creator" content="@${tweet.author.screen_name}"/>`,
    `<meta property="twitter:title" content="${tweet.author.name} (@${tweet.author.screen_name})"/>`
  ];

  /* This little thing ensures if by some miracle a FixTweet embed is loaded in a browser,
     it will gracefully redirect to the destination instead of just seeing a blank screen.

     Telegram is dumb and it just gets stuck if this is included, so we never include it for Telegram UAs. */
  if (userAgent?.indexOf('Telegram') === -1) {
    headers.push(
      `<meta http-equiv="refresh" content="0;url=https://twitter.com/${tweet.author.screen_name}/status/${tweet.id}"/>`
    );
  }

  /* This Tweet has a translation attached to it, so we'll render it. */
  if (tweet.translation) {
    const { translation } = tweet;

    const formatText =
      language === 'en'
        ? Strings.TRANSLATE_TEXT.format({
            language: translation.source_lang_en
          })
        : Strings.TRANSLATE_TEXT_INTL.format({
            source: translation.source_lang.toUpperCase(),
            destination: translation.target_lang.toUpperCase()
          });

    newText = `${formatText}\n\n` + `${translation.text}\n\n`;
  }

  /* This Tweet has a video to render.

     Twitter supports multiple videos in a Tweet now. But we have no mechanism to embed more than one.
     You can still use /video/:number to get a specific video. Otherwise, it'll pick the first. */
  if (tweet.media?.videos) {
    authorText = newText || '';

    if (tweet?.translation) {
      authorText = tweet.translation?.text || '';
    }

    const { videos } = tweet.media;
    const video = videos[(mediaNumber || 1) - 1];

    /* This fix is specific to Discord not wanting to render videos that are too large,
       or rendering low quality videos too small.
       
       Basically, our solution is to cut the dimensions in half if the video is too big (> 1080p),
       or double them if it's too small. (<400p)
       
       We check both height and width so we can apply this to both horizontal and vertical videos equally*/

    let sizeMultiplier = 1;

    if (video.width > 1920 || video.height > 1920) {
      sizeMultiplier = 0.5;
    }
    if (video.width < 400 && video.height < 400) {
      sizeMultiplier = 2;
    }

    /* Like photos when picking a specific one (not using mosaic),
       we'll put an indicator if there are more than one video */
    if (videos.length > 1) {
      const videoCounter = Strings.VIDEO_COUNT.format({
        number: String(videos.indexOf(video) + 1),
        total: String(videos.length)
      });

      authorText =
        authorText === Strings.DEFAULT_AUTHOR_TEXT
          ? videoCounter
          : `${authorText}${authorText ? '   ―   ' : ''}${videoCounter}`;

      siteName = `${Constants.BRANDING_NAME} - ${videoCounter}`;

      if (engagementText) {
        siteName = `${Constants.BRANDING_NAME} - ${engagementText} - ${videoCounter}`;
      }
    }

    /* Push the raw video-related headers */
    headers.push(
      `<meta property="twitter:player:stream:content_type" content="${video.format}"/>`,
      `<meta property="twitter:player:height" content="${video.height * sizeMultiplier}"/>`,
      `<meta property="twitter:player:width" content="${video.width * sizeMultiplier}"/>`,
      `<meta property="og:video" content="${video.url}"/>`,
      `<meta property="og:video:secure_url" content="${video.url}"/>`,
      `<meta property="og:video:height" content="${video.height * sizeMultiplier}"/>`,
      `<meta property="og:video:width" content="${video.width * sizeMultiplier}"/>`,
      `<meta property="og:video:type" content="${video.format}"/>`,
      `<meta property="twitter:image" content="0"/>`
    );
  }

  /* This Tweet has one or more photos to render */
  if (tweet.media?.photos) {
    const { photos } = tweet.media;
    let photo: APIPhoto | APIMosaicPhoto = photos[(mediaNumber || 1) - 1];

    /* If there isn't a specified media number and we have a
       mosaic response, we'll render it using mosaic */
    if (typeof mediaNumber !== 'number' && tweet.media.mosaic) {
      photo = {
        /* Include dummy height/width for TypeScript reasons. We have a check to make sure we don't use these later. */
        height: 0,
        width: 0,
        url: tweet.media.mosaic.formats.jpeg,
        type: 'photo'
      };
      /* If mosaic isn't available or the link calls for a specific photo,
         we'll indicate which photo it is out of the total */
    } else if (photos.length > 1) {
      const photoCounter = Strings.PHOTO_COUNT.format({
        number: String(photos.indexOf(photo) + 1),
        total: String(photos.length)
      });

      authorText =
        authorText === Strings.DEFAULT_AUTHOR_TEXT
          ? photoCounter
          : `${authorText}${authorText ? '   ―   ' : ''}${photoCounter}`;

      siteName = `${Constants.BRANDING_NAME} - ${photoCounter}`;

      if (engagementText) {
        siteName = `${Constants.BRANDING_NAME} - ${engagementText} - ${photoCounter}`;
      }
    }

    /* Push the raw photo-related headers */
    headers.push(
      `<meta property="twitter:image" content="${photo.url}"/>`,
      `<meta property="og:image" content="${photo.url}"/>`
    );

    if (!tweet.media.mosaic) {
      headers.push(
        `<meta property="twitter:image:width" content="${photo.width}"/>`,
        `<meta property="twitter:image:height" content="${photo.height}"/>`,
        `<meta property="og:image:width" content="${photo.width}"/>`,
        `<meta property="og:image:height" content="${photo.height}"/>`
      );
    }
  }

  /* We have external media available to us (i.e. YouTube videos) */
  if (tweet.media?.external) {
    const { external } = tweet.media;
    authorText = newText || '';
    headers.push(
      `<meta property="twitter:player" content="${external.url}">`,
      `<meta property="twitter:player:width" content="${external.width}">`,
      `<meta property="twitter:player:height" content="${external.height}">`,
      `<meta property="og:type" content="video.other">`,
      `<meta property="og:video:url" content="${external.url}">`,
      `<meta property="og:video:secure_url" content="${external.url}">`,
      `<meta property="og:video:width" content="${external.width}">`,
      `<meta property="og:video:height" content="${external.height}">`
    );
  }

  /* This Tweet contains a poll, so we'll render it */
  if (tweet.poll) {
    const { poll } = tweet;
    let barLength = 36;
    let str = '';

    /* Telegram Embeds are smaller, so we use a smaller bar to compensate */
    if (userAgent?.indexOf('Telegram') !== -1) {
      barLength = 24;
    }

    /* Render each poll choice */
    tweet.poll.choices.forEach(choice => {
      const bar = '█'.repeat((choice.percentage / 100) * barLength);
      // eslint-disable-next-line no-irregular-whitespace
      str += `${bar}\n${choice.label}  (${choice.percentage}%)\n`;
    });

    /* Finally, add the footer of the poll with # of votes and time left */
    str += `\n${poll.total_votes} votes · ${poll.time_left_en}`;

    /* And now we'll put the poll right after the Tweet text! */
    newText += `\n\n${str}`;
  }

  /* This Tweet quotes another Tweet, so we'll render the other Tweet where possible */
  if (api.tweet?.quote) {
    const quoteText = handleQuote(api.tweet.quote);
    newText += `\n${quoteText}`;
  }

  /* If we have no media to display, instead we'll display the user profile picture in the embed */
  if (!tweet.media?.video && !tweet.media?.photos) {
    headers.push(
      /* Use a slightly higher resolution image for profile pics */
      `<meta property="og:image" content="${tweet.author.avatar_url?.replace(
        '_normal',
        '_200x200'
      )}"/>`,
      `<meta property="twitter:image" content="0"/>`
    );
  }

  /* Notice that user is using deprecated domain */
  if (flags?.deprecated) {
    siteName = Strings.DEPRECATED_DOMAIN_NOTICE;
  }

  /* Push basic headers relating to author, Tweet text, and site name */
  headers.push(
    `<meta property="og:title" content="${tweet.author.name} (@${tweet.author.screen_name})"/>`,
    `<meta property="og:description" content="${sanitizeText(newText)}"/>`,
    `<meta property="og:site_name" content="${siteName}"/>`
  );

  /* Special reply handling if authorText is not overriden */
  if (tweet.replying_to && authorText === Strings.DEFAULT_AUTHOR_TEXT) {
    authorText = `↪ Replying to @${tweet.replying_to}`;
    /* We'll assume it's a thread if it's a reply to themselves */
  } else if (tweet.replying_to === tweet.author.screen_name && authorText === Strings.DEFAULT_AUTHOR_TEXT) {
    authorText = `↪ A part of @${tweet.author.screen_name}'s thread`;
  }

  /* The additional oembed is pulled by Discord to enable improved embeds.
     Telegram does not use this. */
  headers.push(
    `<link rel="alternate" href="${Constants.HOST_URL}/owoembed?text=${encodeURIComponent(
      authorText.substring(0, 200)
    )}${flags?.deprecated ? '&deprecated=true' : ''}&status=${encodeURIComponent(
      status
    )}&author=${encodeURIComponent(
      tweet.author?.screen_name || ''
    )}" type="application/json+oembed" title="${tweet.author.name}">`
  );

  /* When dealing with a Tweet of unknown lang, fall back to en */
  const lang = tweet.lang === null ? 'en' : tweet.lang || 'en';

  /* Finally, after all that work we return the response HTML! */
  return {
    text: Strings.BASE_HTML.format({
      lang: `lang="${lang}"`,
      headers: headers.join('')
    })
  };
};

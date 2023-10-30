import { Constants } from '../constants';
import { handleQuote } from '../helpers/quote';
import { formatNumber, sanitizeText, truncateWithEllipsis } from '../helpers/utils';
import { Strings } from '../strings';
import { getAuthorText } from '../helpers/author';
import { statusAPI } from '../api/status';
import { renderPhoto } from '../render/photo';
import { renderVideo } from '../render/video';
import { renderInstantView } from '../render/instantview';

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

  const api = await statusAPI(status, language, event as FetchEvent, flags);
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
      console.log(api);
      return returnError(Strings.ERROR_API_FAIL);
  }

  const isTelegram = (userAgent || '').indexOf('Telegram') > -1;
  /* Should sensitive posts be allowed Instant View? */
  let useIV =
    isTelegram /*&& !tweet.possibly_sensitive*/ &&
    !flags?.direct &&
    !flags?.api &&
    (tweet.media?.photos?.[0] || // Force instant view for photos for now https://bugs.telegram.org/c/33679
      tweet.media?.mosaic ||
      tweet.is_note_tweet ||
      tweet.quote ||
      tweet.translation ||
      flags?.forceInstantView);

  /* Force enable IV for archivers */
  if (flags?.archive) {
    useIV = true;
  }

  let ivbody = '';

  let overrideMedia: APIMedia | undefined;

  // Check if mediaNumber exists, and if that media exists in tweet.media.all. If it does, we'll store overrideMedia variable
  if (mediaNumber && tweet.media && tweet.media.all && tweet.media.all[mediaNumber - 1]) {
    overrideMedia = tweet.media.all[mediaNumber - 1];
  }

  /* Catch direct media request (d.fxtwitter.com, or .mp4 / .jpg) */
  if (flags?.direct && !flags?.textOnly && tweet.media) {
    let redirectUrl: string | null = null;
    const all = tweet.media.all || [];
    // if (tweet.media.videos) {
    //   const { videos } = tweet.media;
    //   redirectUrl = (videos[(mediaNumber || 1) - 1] || videos[0]).url;
    // } else if (tweet.media.photos) {
    //   const { photos } = tweet.media;
    //   redirectUrl = (photos[(mediaNumber || 1) - 1] || photos[0]).url;
    // }

    const selectedMedia = all[(mediaNumber || 1) - 1];
    if (selectedMedia) {
      redirectUrl = selectedMedia.url;
    } else if (all.length > 0) {
      redirectUrl = all[0].url;
    }

    if (redirectUrl) {
      return { response: Response.redirect(redirectUrl, 302) };
    }
  }

  /* At this point, we know we're going to have to create a
     regular embed because it's not an API or direct media request */

  let authorText = getAuthorText(tweet) || Strings.DEFAULT_AUTHOR_TEXT;
  const engagementText = authorText.replace(/ {4}/g, ' ');
  let siteName = Constants.BRANDING_NAME;
  let newText = tweet.text;
  let cacheControl: string | null = null;

  /* Base headers included in all responses */
  const headers = [
    `<link rel="canonical" href="${Constants.TWITTER_ROOT}/${tweet.author.screen_name}/status/${tweet.id}"/>`,
    `<meta property="og:url" content="${Constants.TWITTER_ROOT}/${tweet.author.screen_name}/status/${tweet.id}"/>`,
    `<meta property="theme-color" content="#00a8fc"/>`,
    `<meta property="twitter:site" content="@${tweet.author.screen_name}"/>`,
    `<meta property="twitter:creator" content="@${tweet.author.screen_name}"/>`,
    `<meta property="twitter:title" content="${tweet.author.name} (@${tweet.author.screen_name})"/>`
  ];

  /* This little thing ensures if by some miracle a FixTweet embed is loaded in a browser,
     it will gracefully redirect to the destination instead of just seeing a blank screen.

     Telegram is dumb and it just gets stuck if this is included, so we never include it for Telegram UAs. */
  if (!isTelegram) {
    headers.push(
      `<meta http-equiv="refresh" content="0;url=${Constants.TWITTER_ROOT}/${tweet.author.screen_name}/status/${tweet.id}"/>`
    );
  }

  if (useIV) {
    try {
      const instructions = renderInstantView({
        tweet: tweet,
        text: newText,
        flags: flags
      });
      headers.push(...instructions.addHeaders);
      if (instructions.authorText) {
        authorText = instructions.authorText;
      }
      ivbody = instructions.text || '';
    } catch (e) {
      console.log('Error rendering Instant View', e);
      useIV = false;
    }
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

  console.log('overrideMedia', JSON.stringify(overrideMedia));

  if (!flags?.textOnly) {
    const media = tweet.media || tweet.quote?.media;
    if (overrideMedia) {
      let instructions: ResponseInstructions;

      switch (overrideMedia.type) {
        case 'photo':
          /* This Tweet has a photo to render. */
          instructions = renderPhoto(
            {
              tweet: tweet,
              authorText: authorText,
              engagementText: engagementText,
              userAgent: userAgent,
              isOverrideMedia: true
            },
            overrideMedia as APIPhoto
          );
          headers.push(...instructions.addHeaders);
          if (instructions.authorText) {
            authorText = instructions.authorText;
          }
          if (instructions.siteName) {
            siteName = instructions.siteName;
          }
          /* Overwrite our Twitter Card if overriding media, so it displays correctly in Discord */
          if (tweet.embed_card === 'player') {
            tweet.embed_card = 'summary_large_image';
          }
          break;
        case 'video':
          instructions = renderVideo(
            { tweet: tweet, userAgent: userAgent, text: newText, isOverrideMedia: true },
            overrideMedia as APIVideo
          );
          headers.push(...instructions.addHeaders);
          if (instructions.authorText) {
            authorText = instructions.authorText;
          }
          if (instructions.siteName) {
            siteName = instructions.siteName;
          }
          /* Overwrite our Twitter Card if overriding media, so it displays correctly in Discord */
          if (tweet.embed_card !== 'player') {
            tweet.embed_card = 'player';
          }
          /* This Tweet has a video to render. */
          break;
      }
    } else if (media?.videos) {
      const instructions = renderVideo(
        { tweet: tweet, userAgent: userAgent, text: newText },
        media.videos[0]
      );
      headers.push(...instructions.addHeaders);
      if (instructions.authorText) {
        authorText = instructions.authorText;
      }
      if (instructions.siteName) {
        siteName = instructions.siteName;
      }
    } else if (media?.mosaic) {
      const instructions = renderPhoto(
        {
          tweet: tweet,
          authorText: authorText,
          engagementText: engagementText,
          userAgent: userAgent
        },
        media.mosaic
      );
      headers.push(...instructions.addHeaders);
    } else if (media?.photos) {
      const instructions = renderPhoto(
        {
          tweet: tweet,
          authorText: authorText,
          engagementText: engagementText,
          userAgent: userAgent
        },
        media.photos[0]
      );
      headers.push(...instructions.addHeaders);
    } else if (media?.external) {
      const { external } = media;
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
  }

  /* This Tweet contains a poll, so we'll render it */
  if (tweet.poll) {
    const { poll } = tweet;
    let barLength = 32;
    let str = '';

    /* Telegram Embeds are smaller, so we use a smaller bar to compensate */
    if (isTelegram) {
      barLength = 24;
    }

    /* Render each poll choice */
    tweet.poll.choices.forEach(choice => {
      const bar = '█'.repeat((choice.percentage / 100) * barLength);
      // eslint-disable-next-line no-irregular-whitespace
      str += `${bar}\n${choice.label}  (${choice.percentage}%)\n`;
    });

    /* Finally, add the footer of the poll with # of votes and time left */
    str += `\n${formatNumber(poll.total_votes)} votes · ${poll.time_left_en}`;

    /* Check if the poll is ongoing and apply low TTL cache control.
       Yes, checking if this is a string is a hacky way to do this, but
       it can do it in way less code than actually comparing dates */
    if (poll.time_left_en !== 'Final results') {
      cacheControl = Constants.POLL_TWEET_CACHE;
    }

    /* And now we'll put the poll right after the Tweet text! */
    newText += `\n\n${str}`;
  }

  /* This Tweet quotes another Tweet, so we'll render the other Tweet where possible */
  if (api.tweet?.quote) {
    const quoteText = handleQuote(api.tweet.quote);
    newText += `\n${quoteText}`;
  }

  /* If we have no media to display, instead we'll display the user profile picture in the embed */
  if (
    !tweet.media?.videos &&
    !tweet.media?.photos &&
    !tweet.quote?.media?.photos &&
    !tweet.quote?.media?.videos &&
    !flags?.textOnly
  ) {
    /* Use a slightly higher resolution image for profile pics */
    const avatar = tweet.author.avatar_url;
    if (!useIV) {
      headers.push(
        `<meta property="og:image" content="${avatar}"/>`,
        `<meta property="twitter:image" content="0"/>`
      );
    } else {
      headers.push(`<meta property="twitter:image" content="${avatar}"/>`);
    }
  }

  /* Notice that user is using deprecated domain */
  if (flags?.deprecated) {
    siteName = Strings.DEPRECATED_DOMAIN_NOTICE;
  }
  /* For supporting Telegram IV, we have to replace newlines with <br> within the og:description <meta> tag because of its weird (undocumented?) behavior.
     If you don't use IV, it uses newlines just fine. Just like Discord and others. But with IV, suddenly newlines don't actually break the line anymore.

     This is incredibly stupid, and you'd think this weird behavior would not be the case. You'd also think embedding a <br> inside the quotes inside
     a meta tag shouldn't work, because that's stupid, but alas it does.
     
     A possible explanation for this weird behavior is due to the Medium template we are forced to use because Telegram IV is not an open platform
     and we have to pretend to be Medium in order to get working IV, but haven't figured if the template is causing issues.  */
  const text = useIV ? sanitizeText(newText).replace(/\n/g, '<br>') : sanitizeText(newText);

  const useCard = tweet.embed_card === 'tweet' ? tweet.quote?.embed_card : tweet.embed_card;

  /* Push basic headers relating to author, Tweet text, and site name */
  headers.push(
    `<meta property="og:title" content="${tweet.author.name} (@${tweet.author.screen_name})"/>`,
    `<meta property="og:description" content="${text}"/>`,
    `<meta property="og:site_name" content="${siteName}"/>`,
    `<meta property="twitter:card" content="${useCard}"/>`
  );

  /* Special reply handling if authorText is not overriden */
  if (tweet.replying_to && authorText === Strings.DEFAULT_AUTHOR_TEXT) {
    authorText = `↪ Replying to @${tweet.replying_to}`;
    /* We'll assume it's a thread if it's a reply to themselves */
  } else if (
    tweet.replying_to === tweet.author.screen_name &&
    authorText === Strings.DEFAULT_AUTHOR_TEXT
  ) {
    authorText = `↪ A part of @${tweet.author.screen_name}'s thread`;
  }

  /* The additional oembed is pulled by Discord to enable improved embeds.
     Telegram does not use this. */
  headers.push(
    `<link rel="alternate" href="{base}/owoembed?text={text}{deprecatedFlag}&status={status}&author={author}&useXbranding={useXBranding}" type="application/json+oembed" title="{name}">`.format(
      {
        base: Constants.HOST_URL,
        text: encodeURIComponent(truncateWithEllipsis(authorText, 256)),
        deprecatedFlag: flags?.deprecated ? '&deprecated=true' : '',
        status: encodeURIComponent(status),
        author: encodeURIComponent(tweet.author?.screen_name || ''),
        useXBranding: flags?.isXDomain ? 'true' : 'false',
        name: tweet.author.name || ''
      }
    )
  );

  /* When dealing with a Tweet of unknown lang, fall back to en */
  const lang = tweet.lang === null ? 'en' : tweet.lang || 'en';

  /* Finally, after all that work we return the response HTML! */
  return {
    text: Strings.BASE_HTML.format({
      lang: `lang="${lang}"`,
      headers: headers.join(''),
      body: ivbody
    }).replace(/>(\s+)</gm, '><'), // Remove whitespace between tags
    cacheControl: cacheControl
  };
};

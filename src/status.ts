import { Constants } from './constants';
import { fetchUsingGuest } from './fetch';
import { Html } from './html';
import { colorFromPalette } from './palette';
import { renderPoll } from './poll';
import { handleQuote } from './quote';

export const handleStatus = async (
  handle: string,
  status: string,
  mediaNumber?: number
): Promise<string> => {
  const conversation = await fetchUsingGuest(status);

  const tweet = conversation?.globalObjects?.tweets?.[status] || {};
  /* With v2 conversation API we re-add the user object ot the tweet because
     Twitter stores it separately in the conversation API. This is to consolidate
     it in case a user appears multiple times in a thread. */
  tweet.user = conversation?.globalObjects?.users?.[tweet.user_id_str] || {};

  console.log(tweet);

  /* Try to deep link to mobile apps, just like Twitter does.
     No idea if this actually works.*/
  let headers: string[] = [
    `<meta property="fb:app_id" content="2231777543"/>`,
    `<meta content="twitter://status?id=${status}" property="al:ios:url"/>`,
    `<meta content="333903271" property="al:ios:app_store_id"/>`,
    `<meta content="Twitter" property="al:ios:app_name"/>`,
    `<meta content="twitter://status?id=${status}" property="al:android:url"/>`,
    `<meta content="com.twitter.android" property="al:android:package"/>`,
    `<meta content="Twitter" property="al:android:app_name"/>`
  ];

  // Fallback for if Tweet did not load
  if (typeof tweet.full_text === 'undefined') {
    headers.push(
      `<meta content="Twitter" property="og:title"/>`,
      `<meta content="Tweet failed to load :(" property="og:description"/>`
    );

    return Html.BASE_HTML.format({
      lang: '',
      headers: headers.join(''),
      tweet: JSON.stringify(tweet)
    });
  }

  let text = tweet.full_text;
  const user = tweet.user;
  const screenName = user?.screen_name || '';
  const name = user?.name || '';

  const mediaList = Array.from(
    tweet.extended_entities?.media || tweet.entities?.media || []
  );

  let authorText = 'Twitter';

  // This is used to chop off the end if it's like pic.twitter.com or something
  if (tweet.display_text_range) {
    const [start, end] = tweet.display_text_range;
    // We ignore start because it cuts off reply handles
    // text = text.substring(0, end + 1);
  }

  if (tweet.card) {
    text += await renderPoll(tweet.card);
  }

  // Replace t.co links with their full counterparts
  if (typeof tweet.entities?.urls !== 'undefined') {
    tweet.entities?.urls.forEach((url: TcoExpansion) => {
      text = text.replace(url.url, url.expanded_url);
    });
    text = text.replace(/ ?https\:\/\/t\.co\/\w{10}/, '');
  }

  if (
    typeof tweet.extended_entities?.media === 'undefined' &&
    typeof tweet.entities?.media === 'undefined'
  ) {
    let palette = user?.profile_image_extensions_media_color?.palette;
    let colorOverride: string = Constants.DEFAULT_COLOR;

    // for loop for palettes
    if (palette) {
      colorOverride = colorFromPalette(palette);
    }

    headers.push(
      `<meta content="${colorOverride}" property="theme-color"/>`,
      `<meta property="og:image" content="${user?.profile_image_url_https.replace(
        '_normal',
        '_200x200'
      )}"/>`,
      `<meta name="twitter:card" content="tweet"/>`,
      `<meta name="twitter:title" content="${name} (@${screenName})"/>`,
      `<meta name="twitter:image" content="0"/>`,
      `<meta name="twitter:creator" content="@${name}"/>`,
      `<meta content="${text}" property="og:description"/>`
    );
  } else {
    let firstMedia = mediaList[0];

    let palette = firstMedia?.ext_media_color?.palette;
    let colorOverride: string = Constants.DEFAULT_COLOR;
    let pushedCardType = false;

    // for loop for palettes
    if (palette) {
      colorOverride = colorFromPalette(palette);
    }

    headers.push(`<meta content="${colorOverride}" property="theme-color"/>`);

    const processMedia = (media: TweetMedia) => {
      if (media.type === 'photo') {
        headers.push(`<meta name="twitter:image" content="${media.media_url_https}"/>`);

        if (!pushedCardType) {
          headers.push(`<meta name="twitter:card" content="summary_large_image"/>`);
          pushedCardType = true;
        }
      } else if (media.type === 'video') {
        headers.push(`<meta name="twitter:image" content="${media.media_url_https}"/>`);

        authorText = encodeURIComponent(text);

        // Find the variant with the highest bitrate
        let bestVariant = media.video_info?.variants?.reduce?.((a, b) =>
          (a.bitrate || 0) > (b.bitrate || 0) ? a : b
        );
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

    let actualMediaNumber = 1;

    console.log('mediaNumber', mediaNumber);

    /* You can specify a specific photo in the URL and we'll pull the correct one,
       otherwise it falls back to first */
    if (
      typeof mediaNumber !== 'undefined' &&
      typeof mediaList[mediaNumber - 1] !== 'undefined'
    ) {
      console.log(`Media ${mediaNumber} found`);
      actualMediaNumber = mediaNumber - 1;
      processMedia(mediaList[actualMediaNumber]);
    } else {
      console.log(`Media ${mediaNumber} not found, ${mediaList.length} total`);
      /* I wish Telegram respected multiple photos in a tweet,
         and that Discord could do the same for 3rd party providers like us */
      // media.forEach(media => processMedia(media));
      processMedia(firstMedia);
    }

    if (mediaList.length > 1) {
      authorText = `Photo ${actualMediaNumber + 1} of ${mediaList.length}`;
      headers.push(
        `<meta property="og:site_name" content="${Constants.BRANDING_NAME} - Photo ${
          actualMediaNumber + 1
        } of ${mediaList.length}"/>`
      );
    } else {
      headers.push(
        `<meta property="og:site_name" content="${Constants.BRANDING_NAME}"/>`
      );
    }

    headers.push(
      `<meta content="${name} (@${screenName})" property="og:title"/>`,
      `<meta content="${text}" property="og:description"/>`
    );
  }

  let quoteTweetMaybe =
    conversation.globalObjects?.tweets?.[tweet.quoted_status_id_str || '0'] || null;

  if (quoteTweetMaybe) {
    const quoteText = handleQuote(quoteTweetMaybe);

    if (quoteText) {
    }
  }

  /* Special reply handling if authorText is not overriden */
  if (tweet.in_reply_to_screen_name && authorText === 'Twitter') {
    authorText = `↪ Replying to @${tweet.in_reply_to_screen_name}`;
  }

  /* The additional oembed is pulled by Discord to enable improved embeds.
     Telegram does not use this. */
  headers.push(
    `<link rel="alternate" href="/owoembed?text=${encodeURIComponent(
      authorText
    )}&status=${encodeURIComponent(status)}&author=${encodeURIComponent(
      user?.screen_name || ''
    )}" type="application/json+oembed" title="${name}">`
  );

  console.log(JSON.stringify(tweet));

  /* When dealing with a Tweet of unknown lang, fall back to en  */
  let lang = tweet.lang === 'unk' ? 'en' : tweet.lang || 'en';

  return Html.BASE_HTML.format({
    lang: `lang="${lang}"`,
    headers: headers.join('')
  });
};

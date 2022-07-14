import { Constants } from "./constants";
import { fetchUsingGuest } from "./drivers/guest";
import { Html } from "./html";
import { renderPoll } from "./poll";
import { rgbToHex } from "./utils";

const colorFromPalette = (palette: MediaPlaceholderColor[]) => {
  for (let i = 0; i < palette.length; i++) {
    const rgb = palette[i].rgb;

    // We need vibrant colors, grey backgrounds won't do!
    if (rgb.red + rgb.green + rgb.blue < 120) {
      continue;
    }

    return rgbToHex(rgb.red, rgb.green, rgb.blue);
  }

  return Constants.DEFAULT_COLOR;
}

export const handleStatus = async (handle: string, id: string, mediaNumber?: number): Promise<string> => {
  const tweet = await fetchUsingGuest(id);
  console.log(tweet);

  // Try to deep link to mobile apps, just like Twitter does
  let headers: string[] = [
    `<meta property="og:site_name" content="Twitter"/>`,
    `<meta property="fb:app_id" content="2231777543"/>`,
    `<meta content="twitter://status?id=${id}" property="al:ios:url"/>`,
    `<meta content="333903271" property="al:ios:app_store_id"/>`,
    `<meta content="Twitter" property="al:ios:app_name"/>`,
    `<meta content="twitter://status?id=${id}" property="al:android:url"/>`,
    `<meta content="com.twitter.android" property="al:android:package"/>`,
    `<meta content="Twitter" property="al:android:app_name"/>`,
  ];

  // Fallback for if Tweet did not load
  if (typeof tweet.full_text === "undefined") {
    headers.push(
      `<meta content="Twitter" property="og:title"/>`,
      `<meta content="Tweet failed to load :(" property="og:description"/>`
    );

    return Html.BASE_HTML.format({
      lang: '',
      headers: headers.join(''),
      tweet: JSON.stringify(tweet),
    });
  }

  let text = tweet.full_text;
  const user = tweet.user;
  const screenName = user?.screen_name || '';
  const name = user?.name || '';

  let authorText = 'Twitter';

  // This is used to chop off the end if it's like pic.twitter.com or something
  if (tweet.display_text_range) {
    const [start, end] = tweet.display_text_range;
    // We ignore start because it cuts off reply handles
    text = text.substring(0, end + 1);
  }

  if (tweet.card) {
    text += await renderPoll(tweet.card);
  }

  // Replace t.co links with their full counterparts
  if (typeof tweet.entities?.urls !== 'undefined') {
    tweet.entities?.urls.forEach((url: TcoExpansion) => {
      text = text.replace(url.url, url.expanded_url);
    });
  }

  if (typeof tweet.extended_entities?.media === 'undefined' && typeof tweet.entities?.media === 'undefined') {
    let palette = user?.profile_image_extensions_media_color?.palette;
    let colorOverride: string = Constants.DEFAULT_COLOR;

    // for loop for palettes
    if (palette) {
      colorOverride = colorFromPalette(palette);
    }

    headers.push(
      `<meta content="${colorOverride}" property="theme-color"/>`,
      `<meta property="og:image" content="${user?.profile_image_url_https.replace('_normal', '_200x200')}"/>`,
      `<meta name="twitter:card" content="tweet"/>`,
      `<meta name="twitter:title" content="${name} (@${screenName})"/>`,
      `<meta name="twitter:image" content="0"/>`,
      `<meta name="twitter:creator" content="@${name}"/>`,
      `<meta content="${text}" property="og:description"/>`
    );
  } else {
    let media = tweet.extended_entities?.media || tweet.entities?.media || [];

    let firstMedia = media[0];

    let palette = firstMedia?.ext_media_color?.palette;
    let colorOverride: string = Constants.DEFAULT_COLOR;
    let pushedCardType = false;

    // for loop for palettes
    if (palette) {
      colorOverride = colorFromPalette(palette);
    }
    
    headers.push(
      `<meta content="${colorOverride}" property="theme-color"/>`
    )

    const processMedia = (media: TweetMedia) => {
      if (media.type === 'photo') {
        headers.push(
          `<meta name="twitter:image" content="${media.media_url_https}"/>`
        );

        if (!pushedCardType) {
          headers.push(`<meta name="twitter:card" content="summary_large_image"/>`);
          pushedCardType = true;
        }
      } else if (media.type === 'video') {
        headers.push(
          `<meta name="twitter:image" content="${media.media_url_https}"/>`
        );

        authorText = encodeURIComponent(text);

        // Find the variant with the highest bitrate
        let bestVariant = media.video_info?.variants?.reduce?.((a, b) => (a.bitrate || 0) > (b.bitrate || 0) ? a : b);
        headers.push(
          `<meta name="twitter:card" content="player"/>`,
          `<meta name="twitter:player:stream" content="${bestVariant?.url}"/>`,
          `<meta name="twitter:player:stream:content_type" content="${bestVariant?.content_type}"/>`,
          `<meta name="twitter:player:height" content="${media.original_info.height}"/>`,
          `<meta name="twitter:player:width" content="${media.original_info.height}"/>`,
          `<meta name="og:video" content="${bestVariant?.url}"/>`,
          `<meta name="og:video:secure_url" content="${bestVariant?.url}"/>`,
          `<meta name="og:video:height" content="${media.original_info.height}"/>`,
          `<meta name="og:video:width" content="${media.original_info.height}"/>`,
          `<meta name="og:video:type" content="${bestVariant?.content_type}"/>`
        );
      }
    }

    // You can specify a specific photo in the URL
    if (typeof mediaNumber === "number" && media[mediaNumber]) {
      processMedia(media[mediaNumber]);
    } else {
      // I wish Telegram respected multiple photos in a tweet
      // media.forEach(media => processMedia(media));
      processMedia(firstMedia);
    }

    headers.push(
      `<meta content="${name} (@${screenName})" property="og:title"/>`,
      `<meta content="${text}" property="og:description"/>`
    );
  }

  if (typeof tweet.in_reply_to_screen_name !== "undefined") {
    authorText = `↪️ @${tweet.in_reply_to_screen_name}`;
  }

  headers.push(`<link rel="alternate" href="https://pxtwitter.com/owoembed?text=${authorText}" type="application/json+oembed" title="${name}">`)

  console.log(JSON.stringify(tweet))

  return Html.BASE_HTML.format({
    lang: `lang="${tweet.lang || 'en'}"`,
    headers: headers.join('')
  });
};

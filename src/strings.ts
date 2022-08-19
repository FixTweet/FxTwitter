declare global {
  interface String {
    format(options: { [find: string]: string }): string;
  }
}

/* Useful little function to format strings for us */
String.prototype.format = function (options: { [find: string]: string }) {
  return this.replace(/{([^{}]+)}/g, (match: string, name: string) => {
    if (options[name] !== undefined) {
      return options[name];
    }
    return match;
  });
};

/* Lots of strings! These are strings used in HTML or are shown to end users in embeds. */
export const Strings = {
  BASE_HTML: `<!DOCTYPE html><html {lang}><!--

   █████ ▐█▌       ███████████                              ███
 ███      █            ███                                  ███
███                    ███                                  ███
███      ███  ███  ███ ███  ███  ███  ███  ██████   ██████  ██████
███████▌ ███   ▐█▌▐█▌  ███  ███  ███  ███ ▐█▌  ▐█▌ ▐█▌  ▐█▌ ███
███      ███    ▐██▌   ███  ███  ███  ███ ████████ ████████ ███
███      ███   ▐█▌▐█▌  ███  ▐██▌ ███ ▐██▌ ▐█▌      ▐█▌      ▐██▌
███      ███  ███  ███ ███   ▐█████████▌    ▐████    ▐████    ▐████
███
███   A better Tweet embedding service
███   by @dangeredwolf, et al.

--><head>{headers}</head>
<!-- Worker build ${RELEASE_NAME} -->`,
  ERROR_HTML: `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta content="FixTweet" property="og:title"/>
      <meta content="Owie, you crashed ${BRANDING_NAME} :(

This is caused by Twitter API downtime or a new bug. Try again in a little while." property="og:description"/></head>
      <title>:(</title>
      <style>
        body {
          font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          padding: 0 20px;
        }
        h1 {
          font-size: 4em;
          font-weight: 900;
          margin-bottom: 0;
        }
        p {
          font-size:10px;
          opacity:0.3
        }
      </style>
    </head>
    <body>
      <h1>Owie :(</h1>
      <h2>You hit a snag that broke ${BRANDING_NAME}. It's not your fault though&mdash;This is usually caused by a Twitter outage or a new bug.</h2>
      <p>${RELEASE_NAME}</p>
    </body>
  </html>`.replace(/( {2}|\n)/g, ''),
  DEFAULT_AUTHOR_TEXT: 'Twitter',

  QUOTE_TEXT: `═ ↘️ Quoting {name} (@{screen_name}) ═════`,
  TRANSLATE_TEXT: `═ Translated from {language} ═════`,
  TRANSLATE_TEXT_INTL: `═ ↘️ {source} ➡️ {destination} ═════`,
  PHOTO_COUNT: `Photo {number} of {total}`,
  VIDEO_COUNT: `Video {number} of {total}`,

  SINGULAR_DAY_LEFT: 'day left',
  PLURAL_DAYS_LEFT: 'days left',
  SINGULAR_HOUR_LEFT: 'hour left',
  PLURAL_HOURS_LEFT: 'hours left',
  SINGULAR_MINUTE_LEFT: 'minute left',
  PLURAL_MINUTES_LEFT: 'minutes left',
  SINGULAR_SECOND_LEFT: 'second left',
  PLURAL_SECONDS_LEFT: 'seconds left',
  FINAL_POLL_RESULTS: 'Final results',

  ERROR_API_FAIL: 'Tweet failed to load due to an API error :(',
  ERROR_PRIVATE: `I can't embed Tweets from private accounts, sorry about that :(`,
  ERROR_TWEET_NOT_FOUND: `Sorry, that Tweet doesn't exist :(`,
  ERROR_UNKNOWN: `Unknown error occurred, sorry about that :(`,

  TWITFIX_API_SUNSET: `The original TwitFix API has been sunset. To learn more about the FixTweet API, check out <a href="https://${
    API_HOST_LIST.split(',')[0]
  }">${API_HOST_LIST.split(',')[0]}</a>`,
  DEPRECATED_DOMAIN_NOTICE: `We've moved! ➡ fxtwitter.com`,
  DEPRECATED_DOMAIN_NOTICE_DISCORD: `We've moved! ➡ fxtwitter.com`
};

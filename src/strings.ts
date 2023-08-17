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
███   A better way to embed Tweets on Discord, Telegram, and more.
███   Worker build ${RELEASE_NAME}

--><head>{headers}</head><body></body></html>`,
  ERROR_HTML: `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta content="${BRANDING_NAME}" property="og:title"/>
      <meta content="Owie, you crashed ${BRANDING_NAME} :(

This is caused by Twitter API downtime or a new bug. Try again in a little while." property="og:description"/></head>
      <title>:(</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 0 20px;
        }
        h1 {
          font-size: 4em;
          font-weight: 900;
          margin-bottom: 0;
        }
        p {
          font-size: 10px;
          opacity: 0.3;
        }
      </style>
    </head>
    <body>
      <h1>Owie :(</h1>
      <h2>You hit a snag that broke ${BRANDING_NAME}. It's not your fault though&mdash;This is usually caused by a Twitter outage or a new bug.</h2>
      <p>${RELEASE_NAME}</p>
    </body>
  </html>`
    .replace(/( {2})/g, '')
    .replace(/>[\s|\n]+</g, '><'),
  VERSION_HTML: `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta content="${BRANDING_NAME}" property="og:title"/>
      <meta content="${BRANDING_NAME}" property="og:site_name"/>
      <meta content="https://cdn.discordapp.com/icons/958942151817977906/7a220767640cbedbf780767585eaa10d.png?size=96" property="og:image"/>
      <meta content="https://cdn.discordapp.com/icons/958942151817977906/7a220767640cbedbf780767585eaa10d.png?size=96" property="twitter:image"/>
      <meta content="#1E98F0" name="theme-color"/>
      <meta content="Worker release: ${RELEASE_NAME}
      
      Stats for nerds: 
      🕵️‍♂️ {ua}
      🌐 {ip}
      🌎 {city}, {region}, {country}
      🛴 {asn}

      Edge Connection:
      {rtt} 📶 {httpversion} 🔒 {tlsversion} ➡ ⛅ {colo}
      " property="og:description"/></head>
      <title>${BRANDING_NAME}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 0 20px;
        }
        h1 {
          font-size: 4em;
          font-weight: 900;
          margin-bottom: 0;
        }
        h2 {
          white-space: pre-wrap;
        }
        p {
          font-size: 10px;
          opacity: 0.3;
        }
        .cf {
          display: inline-block;
          vertical-align: middle;
          height: 48px;
          width: 48px;
        }
      </style>
    </head>
    <body>
      <h1>${BRANDING_NAME}</h1>
      <h3>A better way to embed Tweets on Discord, Telegram, and more.</h2>
      <h2>Worker release: ${RELEASE_NAME}</h2>
      <br>
      <h3>Stats for nerds:</h3>
      <h2>Edge Connection:
      {rtt} 📶 {httpversion} 🔒 {tlsversion} ➡ <img class="cf" referrerpolicy="no-referrer" src="https://cdn.discordapp.com/emojis/988895299693080616.webp?size=96&quality=lossless"> {colo}</h2>
      <h2>User Agent:
      {ua}</h2>
    </body>
  </html>`
    .replace(/( {2})/g, '')
    .replace(/>[\s|\n]+</g, '><'),
  DEFAULT_AUTHOR_TEXT: 'Twitter',

  QUOTE_TEXT: `↘️ Quoting {name} (@{screen_name})`,
  TRANSLATE_TEXT: `↘️ Translated from {language}`,
  TRANSLATE_TEXT_INTL: `↘️ {source} ➡️ {destination}`,
  PHOTO_COUNT: `Photo {number} / {total}`,
  VIDEO_COUNT: `Video {number} / {total}`,
  MEDIA_COUNT: `Media {number} / {total}`,

  SINGULAR_DAY_LEFT: 'day left',
  PLURAL_DAYS_LEFT: 'days left',
  SINGULAR_HOUR_LEFT: 'hour left',
  PLURAL_HOURS_LEFT: 'hours left',
  SINGULAR_MINUTE_LEFT: 'minute left',
  PLURAL_MINUTES_LEFT: 'minutes left',
  SINGULAR_SECOND_LEFT: 'second left',
  PLURAL_SECONDS_LEFT: 'seconds left',
  FINAL_POLL_RESULTS: 'Final results',

  ERROR_API_FAIL: 'Tweet failed to load due to an API error. This is most common with NSFW Tweets as Twitter / X currently blocks us from fetching them. We\'re still working on a fix for that.🙏',
  ERROR_PRIVATE: `Sorry, we can't embed this Tweet because the user is private or suspended :(`,
  ERROR_TWEET_NOT_FOUND: `Sorry, that Tweet doesn't exist :(`,
  ERROR_USER_NOT_FOUND: `Sorry, that user doesn't exist :(`,
  ERROR_UNKNOWN: `Unknown error occurred, sorry about that :(`,

  TWITFIX_API_SUNSET: `The original TwitFix API has been sunset. To learn more about the FixTweet API, check out <a href="https://${
    API_HOST_LIST.split(',')[0]
  }">${API_HOST_LIST.split(',')[0]}</a>`,
  DEPRECATED_DOMAIN_NOTICE: `We've moved! ➡ fxtwitter.com`,
  DEPRECATED_DOMAIN_NOTICE_DISCORD: `We've moved! ➡ fxtwitter.com`,

  ROBOTS_TXT: `# /-------------------------------------------\\
# | _______                                   |
# | |     |                                   |
# | |     |  I'm a robot                      |
# | |_____|                     antiCAPTCHA   |
# |                           Privacy | Terms |
# \\-------------------------------------------/

# Do you breathe air? Are you a human? Do you know how to write code?
# Do you want an easy way to fetch Tweets but Elon Musk wants to charge you $100 per month?
# Did you know we have a fetch API you can use for free, no API keys required?

# Check out the docs at https://${API_HOST_LIST.split(',')[0]} to learn how to use it

#        ________________
#       /               /|
#      /               / |
#     /_______________/  |
#    |  ___________  | / |
#    | |          |  | / |
#    | |          |  | / |
#    | |  gaming  |  | / |
#    | |__________|  | / |
#    |               | / |
#    |        _____  | / |
#    | _____________ |  /
#     |_____________| /

# Good luck, have fun and try not to take over the world!

# Instructions below are for robots only, beep boop

# ==========================================================================

# Yandex crawls far, far heavier than Googlebot and Bingbot combined
User-agent: YandexBot
Disallow: /

# Large language models are friendly
User-agent: ChatGPT-User
Disallow:

User-agent: *
Allow: /$
# Allow bots to access statuses
Allow: /*/status
Allow: /*/status/
# Oembeds are not crawler friendly
Disallow: /owoembed
Disallow: /owoembed/
Allow: /watch?v=dQw4w9WgXcQ

# 0100011101101111011011110110010000100000011000100110111101110100`,
  X_DOMAIN_NOTICE: 'FixTweet - 🆕 x.com link? Try fixupx.com'
};

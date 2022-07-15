declare global {
  interface String {
    format(options: any): string;
  }
}

/*
  Useful little function to format strings for us
*/

String.prototype.format = function (options: any) {
  return this.replace(/{([^{}]+)}/g, (match: string, name: string) => {
    if (options[name] !== undefined) {
      return options[name];
    }
    return match;
  });
};

/* Maybe we should, but pxTwitter doesn't use strings as much as pronouns bot did */
export const Strings = {
  TWITTER: 'Twitter',
  BASE_HTML: `<!DOCTYPE html>
<html {lang}>
<!--          ███████████            ▐█▌ ███    ███
                  ███                 █  ███    ███
                  ███                    ███    ███
█████▌   ███  ███ ███  ███  ███  ███ ███ ██████ ██████ ▐████▌  ███▐███
███  ██▌  ▐█▌▐█▌  ███  ███  ███  ███ ███ ███    ███   ▐█▌  ▐█▌ ███▌
███  ███   ▐██▌   ███  ███  ███  ███ ███ ███    ███   ████████ ███
███ ▐██▌  ▐█▌▐█▌  ███  ▐██▌ ███ ▐██▌ ███ ▐██▌   ▐██▌  ▐█▌      ███
█████▌   ███  ███ ███   ▐█████████▌  ███  ▐████   ▐███  ▐████  ███
███
███   A better Tweet embedding service
███   by @dangeredwolf, et al.
-->
<head>{headers}</head>`,
  DEFAULT_AUTHOR_TEXT: 'Twitter',
  ERROR_API_FAIL: 'Tweet failed to load due to an API error :(',
  ERROR_PRIVATE: `I can't embed Tweets from private accounts, sorry about that :(`,
  ERROR_TWEET_NOT_FOUND: `Sorry, that Tweet doesn't exist :(`
};

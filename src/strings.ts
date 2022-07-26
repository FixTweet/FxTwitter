declare global {
  interface String {
    format(options: { [find: string]: string }): string;
  }
}

/*
  Useful little function to format strings for us
*/

String.prototype.format = function (options: { [find: string]: string }) {
  return this.replace(/{([^{}]+)}/g, (match: string, name: string) => {
    if (options[name] !== undefined) {
      return options[name];
    }
    return match;
  });
};

export const Strings = {
  BASE_HTML: `<!DOCTYPE html>
<html {lang}>
<!--
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
-->
<head>{headers}</head>`,
  DEFAULT_AUTHOR_TEXT: 'Twitter',

  QUOTE_TEXT: `═ ↘️ Quoting {name} (@{screen_name}) ═════`,
  TRANSLATE_TEXT: `═ ↘️ Translated from {language} ═════`,
  TRANSLATE_TEXT_INTL: `═ ↘️ {source} ➡️ {destination} ═════`,
  PHOTO_COUNT: `Photo {number} of {total}`,

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
  ERROR_UNKNOWN: `Unknown error occurred, sorry about that :(`
};

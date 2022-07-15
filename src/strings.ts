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
███   The best way to embed tweets.
███   A work in progress by @dangeredwolf
-->
<head>{headers}</head>`
};

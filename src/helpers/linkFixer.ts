/* Helps replace t.co links with their originals */
export const linkFixer = (entities: TcoExpansion[] | undefined, text: string): string => {
  // console.log('got entities', {
  //   entities: tweet.legacy.entities
  // });
  if (Array.isArray(entities) && entities.length) {
    entities.forEach((url: TcoExpansion) => {
      let newURL = url.expanded_url ?? url.url ?? '';

      if (newURL.match(/^https:\/\/twitter\.com\/i\/web\/status\/\w+/g) !== null) {
        newURL = '';
      }
      text = text.replace(url.url, newURL);
    });
  }

  /* Remove any link with unavailable original.
     This means that stuff like the t.co link to pic.twitter.com
     will get removed in image/video Tweets */
  text = text.replace(/ ?https:\/\/t\.co\/\w{10}/g, '');

  return text;
};

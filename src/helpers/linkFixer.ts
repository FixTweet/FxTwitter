/* Helps replace t.co links with their originals */
export const linkFixer = (tweet: GraphQLTweet, text: string): string => {
  if (Array.isArray(tweet.legacy.entities?.urls) && tweet.legacy.entities.urls.length) {
    tweet.legacy.entities.urls.forEach((url: TcoExpansion) => {
      let newURL = url.expanded_url;

      if (newURL.match(/^https:\/\/twitter\.com\/i\/web\/status\/\w+/g) !== null) {
        newURL = '';
      }
      text = text.replace(url.url, newURL);
    });

    /* Remove any link with unavailable original.
       This means that stuff like the t.co link to pic.twitter.com
       will get removed in image/video Tweets */
    text = text.replace(/ ?https:\/\/t\.co\/\w{10}/g, '');
  }

  return text;
};

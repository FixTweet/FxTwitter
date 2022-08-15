/* Helps replace t.co links with their originals */
export const linkFixer = (tweet: TweetPartial, text: string): string => {
  if (typeof tweet.entities?.urls !== 'undefined') {
    tweet.entities?.urls.forEach((url: TcoExpansion) => {
      text = text.replace(url.url, url.expanded_url);
    });

    /* Remove any link with unavailable original.
       This means that stuff like the t.co link to pic.twitter.com
       will get removed in image/video Tweets */
    text = text.replace(/ ?https:\/\/t\.co\/\w{10}/g, '');
  }

  return text;
};

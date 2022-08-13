export const linkFixer = (tweet: TweetPartial, text: string): string => {
  // Replace t.co links with their full counterparts
  if (typeof tweet.entities?.urls !== 'undefined') {
    tweet.entities?.urls.forEach((url: TcoExpansion) => {
      text = text.replace(url.url, url.expanded_url);
    });

    text = text.replace(/ ?https:\/\/t\.co\/\w{10}/g, '');
  }

  return text;
};

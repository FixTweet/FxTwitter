export const getAuthorText = (tweet: TweetPartial): string | null => {
  /* Build out reply, retweet, like counts */
  if (tweet.favorite_count > 0 || tweet.retweet_count > 0 || tweet.reply_count > 0) {
    let authorText = '';
    if (tweet.reply_count > 0) {
      authorText += `${tweet.reply_count} 💬    `;
    }
    if (tweet.retweet_count > 0) {
      authorText += `${tweet.retweet_count} 🔁    `;
    }
    if (tweet.favorite_count > 0) {
      authorText += `${tweet.favorite_count} ❤️    `;
    }
    authorText = authorText.trim();

    return authorText;
  }

  return null;
};

export const getAuthorText = (tweet: APITweet): string | null => {
  /* Build out reply, retweet, like counts */
  if (tweet.likes > 0 || tweet.retweets > 0 || tweet.replies > 0) {
    let authorText = '';
    if (tweet.replies > 0) {
      authorText += `${tweet.replies} 💬    `;
    }
    if (tweet.retweets > 0) {
      authorText += `${tweet.retweets} 🔁    `;
    }
    if (tweet.likes > 0) {
      authorText += `${tweet.likes} ❤️    `;
    }
    authorText = authorText.trim();

    return authorText;
  }

  return null;
};

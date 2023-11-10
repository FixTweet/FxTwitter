import { formatNumber } from './utils';

/* The embed "author" text we populate with replies, retweets, and likes unless it's a video */
export const getAuthorText = (tweet: APITweet): string | null => {
  /* Build out reply, retweet, like counts */
  if (tweet.likes > 0 || tweet.reposts > 0 || tweet.replies > 0 || (tweet.views ? tweet.views > 0 : false)) {
    let authorText = '';
    if (tweet.replies > 0) {
      authorText += `${formatNumber(tweet.replies)} 💬    `;
    }
    if (tweet.reposts > 0) {
      authorText += `${formatNumber(tweet.reposts)} 🔁    `;
    }
    if (tweet.likes > 0) {
      authorText += `${formatNumber(tweet.likes)} ❤️    `;
    }
    if (tweet.views && tweet.views > 0) {
      authorText += `${formatNumber(tweet.views)} 👁️    `;
    }
    authorText = authorText.trim();

    return authorText;
  }

  return null;
};

/* The embed "author" text we populate with replies, retweets, and likes unless it's a video */
export const getSocialTextIV = (tweet: APITweet): string | null => {
  /* Build out reply, retweet, like counts */
  if (tweet.likes > 0 || tweet.reposts > 0 || tweet.replies > 0) {
    let authorText = '';
    if (tweet.replies > 0) {
      authorText += `💬 ${formatNumber(tweet.replies)} `;
    }
    if (tweet.reposts > 0) {
      authorText += `🔁 ${formatNumber(tweet.reposts)} `;
    }
    if (tweet.likes > 0) {
      authorText += `❤️ ${formatNumber(tweet.likes)} `;
    }
    if (tweet.views && tweet.views > 0) {
      authorText += `👁️ ${formatNumber(tweet.views)} `;
    }
    authorText = authorText.trim();

    return authorText;
  }

  return null;
};

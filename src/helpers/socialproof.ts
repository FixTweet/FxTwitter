import { DataProvider } from '../enum';
import { formatNumber } from './utils';

/* The embed "author" text we populate with replies, retweets, and likes unless it's a video */
export const getSocialProof = (status: APIStatus): string | null => {
  let views = 0;

  if (status.provider === DataProvider.Twitter) {
    views = (status as APITwitterStatus).views || 0;
  }
  /* Build out reply, retweet, like counts */
  if (status.likes > 0 || status.reposts > 0 || status.replies > 0 || (views ? views > 0 : false)) {
    let authorText = '';
    if (status.replies > 0) {
      authorText += `💬 ${formatNumber(status.replies)}   `;
    }
    if (status.reposts > 0) {
      authorText += `🔁 ${formatNumber(status.reposts)}   `;
    }
    if (status.likes > 0) {
      authorText += `❤️ ${formatNumber(status.likes)}   `;
    }
    if (views && views > 0) {
      authorText += `👁️ ${formatNumber(views)}   `;
    }
    authorText = authorText.trim();

    return authorText;
  }

  return null;
};

/* The embed "author" text we populate with replies, reposts, and likes unless it's a video */
export const getSocialTextIV = (status: APITwitterStatus): string | null => {
  /* Build out reply, repost, like counts */
  if (status.likes > 0 || status.reposts > 0 || status.replies > 0) {
    let authorText = '';
    if (status.replies > 0) {
      authorText += `💬 ${formatNumber(status.replies)} `;
    }
    if (status.reposts > 0) {
      authorText += `🔁 ${formatNumber(status.reposts)} `;
    }
    if (status.likes > 0) {
      authorText += `❤️ ${formatNumber(status.likes)} `;
    }
    if (status.views && status.views > 0) {
      authorText += `👁️ ${formatNumber(status.views)} `;
    }
    authorText = authorText.trim();

    return authorText;
  }

  return null;
};

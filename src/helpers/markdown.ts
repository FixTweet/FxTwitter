/* eslint-disable no-case-declarations */
import { Constants } from "../constants";

type FormatTag = {
  from_index: number;
  to_index: number;
  type: 'format';
  tag: {
    richtext_types: string[];
  };
};

type MediaTag = {
  from_index: number;
  type: 'media';
  media_id: string;
};

type URLTag = {
  from_index: number;
  to_index: number;
  type: 'url';
  url: TcoExpansion;
};

type HashtagTag = {
  from_index: number;
  to_index: number;
  type: 'hashtag';
  text: string;
};

type CashtagTag = {
  from_index: number;
  to_index: number;
  type: 'cashtag';
  text: string;
};

type UserMentionTag = {
  from_index: number;
  to_index: number;
  type: 'mention';
  screen_name: string;
};

type MarkdownTag = FormatTag | MediaTag | URLTag | HashtagTag | CashtagTag | UserMentionTag;

export const generateStatusMarkdown = (status: GraphQLTwitterStatus): string => {
  const note_tweet = status.note_tweet.note_tweet_results.result ?? null;
  const tags = note_tweet?.richtext?.richtext_tags ?? [];
  const media = status.legacy.extended_entities?.media ?? [];
  const inline_media = note_tweet?.media?.inline_media ?? [];
  const { urls, symbols, hashtags, user_mentions } = note_tweet.entity_set ?? {};

  let formattedText = note_tweet.text;

  // Combine all tags into a single array and sort them
  const combinedTags: MarkdownTag[] = [
    ...tags.map(tag => ({
      from_index: tag.from_index,
      to_index: tag.to_index,
      type: 'format',
      tag: tag
    })),
    ...inline_media.map(item => ({
      from_index: item.index,
      type: 'media',
      media_id: item.media_id
    })),
    ...urls.map(url => ({
      from_index: url.indices[0],
      to_index: url.indices[1],
      type: 'url',
      url
    })),
    ...symbols.map(tag => ({
      from_index: tag.indices[0],
      to_index: tag.indices[1],
      type: 'cashtag',
      text: tag.text
    })),
    ...hashtags.map(tag => ({
      from_index: tag.indices[0],
      to_index: tag.indices[1],
      type: 'hashtag',
      text: tag.text
    })),
    ...user_mentions.map(mention => ({
      from_index: mention.indices[0],
      to_index: mention.indices[1],
      type: 'mention',
      screen_name: mention.screen_name
    }))
  ] as MarkdownTag[];

  combinedTags.sort((a, b) => a.from_index - b.from_index);

  // Reverse to handle from last to first to avoid messing up indices
  combinedTags.reverse();

  combinedTags.forEach(tag => {
    switch (tag.type) {
      case 'format':
        const { from_index, to_index, tag: { richtext_types } } = tag;
        const partToFormat = formattedText.substring(from_index, to_index);
        let formattedPart = partToFormat;
        if (richtext_types.includes("Bold")) {
          formattedPart = `**${formattedPart}**`;
        }
        if (richtext_types.includes("Italic")) {
          formattedPart = `__${formattedPart}__`;
        }
        if (richtext_types.includes("Strikethrough")) {
          formattedPart = `~~${formattedPart}~~`;
        }
        formattedText = formattedText.slice(0, from_index) + formattedPart + formattedText.slice(to_index);
        break;
      case 'media':
        const mediaItem = media.find(m => m.id_str === tag.media_id);
        if (mediaItem && mediaItem.type === 'photo') {
          const imageUrl = mediaItem.media_url_https || mediaItem.media_url;
          const altText = mediaItem.ext_alt_text ?? 'photo';
          const imageMarkdown = `![${altText}](${imageUrl})`;
          formattedText = formattedText.slice(0, tag.from_index) + imageMarkdown + formattedText.slice(tag.from_index);
        }
        break;
      case 'url':
        const urlMarkdown = `[${tag.url.display_url}](${tag.url.expanded_url})`;
        formattedText = formattedText.slice(0, tag.from_index) + urlMarkdown + formattedText.slice(tag.to_index);
        break;
      case 'hashtag':
        const hashtagLink = `${Constants.TWITTER_ROOT}/search?q=%23${encodeURIComponent(tag.text)}`;
        const hashtagMarkdown = `[#${tag.text}](${hashtagLink})`;
        formattedText = formattedText.slice(0, tag.from_index) + hashtagMarkdown + formattedText.slice(tag.to_index);
        break;
      case 'cashtag':
        const cashtagLink = `${Constants.TWITTER_ROOT}/search?q=%24${encodeURIComponent(tag.text)}`;
        const cashtagMarkdown = `[$${tag.text}](${cashtagLink})`;
        formattedText = formattedText.slice(0, tag.from_index) + cashtagMarkdown + formattedText.slice(tag.to_index);
        break;
      case 'mention':
        const mentionLink = `${Constants.TWITTER_ROOT}/${tag.screen_name}`;
        const mentionMarkdown = `[@${tag.screen_name}](${mentionLink})`;
        formattedText = formattedText.slice(0, tag.from_index) + mentionMarkdown + formattedText.slice(tag.to_index + 1);
        break;
    }
  });

  return formattedText;
}

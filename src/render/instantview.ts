/* eslint-disable no-irregular-whitespace */
import { Constants } from '../constants';
import { getSocialTextIV } from '../helpers/author';
import { sanitizeText } from '../helpers/utils';
import { Strings } from '../strings';

const populateUserLinks = (tweet: APIStatus, text: string): string => {
  /* TODO: Maybe we can add username splices to our API so only genuinely valid users are linked? */
  text.match(/@(\w{1,15})/g)?.forEach(match => {
    const username = match.replace('@', '');
    text = text.replace(
      match,
      `<a href="${Constants.TWITTER_ROOT}/${username}" target="_blank" rel="noopener noreferrer">${match}</a>`
    );
  });
  return text;
};

const generateTweetMedia = (tweet: APIStatus): string => {
  let media = '';
  if (tweet.media?.all?.length) {
    tweet.media.all.forEach(mediaItem => {
      switch (mediaItem.type) {
        case 'photo':
          // eslint-disable-next-line no-case-declarations
          const { altText } = mediaItem as APIPhoto;
          media += `<img src="{url}" {altText}/>`.format({
            altText: altText ? `alt="${altText}"` : '',
            url: mediaItem.url
          });
          break;
        case 'video':
          media += `<video src="${mediaItem.url}" alt="${tweet.author.name}'s video. Alt text not available."/>`;
          break;
        case 'gif':
          media += `<video src="${mediaItem.url}" alt="${tweet.author.name}'s gif. Alt text not available."/>`;
          break;
      }
    });
  }
  return media;
};

// const formatDateTime = (date: Date): string => {
//   const yyyy = date.getFullYear();
//   const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
//   const dd = String(date.getDate()).padStart(2, '0');
//   const hh = String(date.getHours()).padStart(2, '0');
//   const min = String(date.getMinutes()).padStart(2, '0');
//   return `${hh}:${min} - ${yyyy}/${mm}/${dd}`;
// }

const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
};

const htmlifyLinks = (input: string): string => {
  const urlPattern = /\bhttps?:\/\/\S+/g;
  return input.replace(urlPattern, url => {
    return `<a href="${url}">${url}</a>`;
  });
};

const htmlifyHashtags = (input: string): string => {
  const hashtagPattern = /#([a-zA-Z_]\w*)/g;
  return input.replace(hashtagPattern, (match, hashtag) => {
    const encodedHashtag = encodeURIComponent(hashtag);
    return `<a href="${Constants.TWITTER_ROOT}/hashtag/${encodedHashtag}?src=hashtag_click">${match}</a>`;
  });
};

function paragraphify(text: string, isQuote = false): string {
  const tag = isQuote ? 'blockquote' : 'p';
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<${tag}>${line}</${tag}>`)
    .join('\n');
}

function getTranslatedText(tweet: APITweet, isQuote = false): string | null {
  if (!tweet.translation) {
    return null;
  }
  let text = paragraphify(sanitizeText(tweet.translation?.text), isQuote);
  text = htmlifyLinks(text);
  text = htmlifyHashtags(text);
  text = populateUserLinks(tweet, text);

  const formatText =
    tweet.translation.target_lang === 'en'
      ? Strings.TRANSLATE_TEXT.format({
          language: tweet.translation.source_lang_en
        })
      : Strings.TRANSLATE_TEXT_INTL.format({
          source: tweet.translation.source_lang.toUpperCase(),
          destination: tweet.translation.target_lang.toUpperCase()
        });

  return `<h4>${formatText}</h4>${text}<h4>Original</h4>`;
}

const notApplicableComment = '<!-- N/A -->';

// 1100 -> 1.1K, 1100000 -> 1.1M
const truncateSocialCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return String(count);
  }
};

const generateTweetFooter = (tweet: APIStatus, isQuote = false): string => {
  const { author } = tweet;

  let description = author.description;
  description = htmlifyLinks(description);
  description = htmlifyHashtags(description);
  description = populateUserLinks(tweet, description);

  return `
    <p>{socialText}</p>
    <br>{viewOriginal}
    <!-- Embed profile picture, display name, and screen name in table -->
    {aboutSection}
    `.format({
    socialText: getSocialTextIV(tweet as APITweet) || '',
    viewOriginal: !isQuote ? `<a href="${tweet.url}">View original post</a>` : notApplicableComment,
    aboutSection: isQuote
      ? ''
      : `<h2>About author</h2>
        {pfp}
        <h2>${author.name}</h2>
        <p><a href="${author.url}">@${author.screen_name}</a></p>
        <p><b>${description}</b></p>
        <p>{location} {website} {joined}</p>
        <p>
          {following} <b>Following</b> 
          {followers} <b>Followers</b> 
          {tweets} <b>Posts</b>
        </p>`.format({
          pfp: `<img src="${author.avatar_url?.replace('_200x200', '_400x400')}" alt="${
            author.name
          }'s profile picture" />`,
          location: author.location ? `📌 ${author.location}` : '',
          website: author.website
            ? `🔗 <a href=${author.website.url}>${author.website.display_url}</a>`
            : '',
          joined: author.joined ? `📆 ${formatDate(new Date(author.joined))}` : '',
          following: truncateSocialCount(author.following),
          followers: truncateSocialCount(author.followers),
          tweets: truncateSocialCount(author.statuses)
        })
  });
};

const generateTweet = (tweet: APIStatus, isQuote = false): string => {
  let text = paragraphify(sanitizeText(tweet.text), isQuote);
  text = htmlifyLinks(text);
  text = htmlifyHashtags(text);
  text = populateUserLinks(tweet, text);

  const translatedText = getTranslatedText(tweet as APITweet, isQuote);

  return `<!-- Telegram Instant View -->
  {quoteHeader}
  <!-- Embed Tweet media -->
  ${generateTweetMedia(tweet)} 
  <!-- Translated text (if applicable) -->
  ${translatedText ? translatedText : notApplicableComment}
  <!-- Embed Tweet text -->
  ${text}
  <!-- Embedded quote tweet -->
  ${!isQuote && tweet.quote ? generateTweet(tweet.quote, true) : notApplicableComment}
  ${!isQuote ? generateTweetFooter(tweet) : ''}
  <br>${!isQuote ? `<a href="${tweet.url}">View original post</a>` : notApplicableComment}
  `.format({
    quoteHeader: isQuote
      ? `<h4><a href="${tweet.url}">Quoting</a> ${tweet.author.name} (<a href="${Constants.TWITTER_ROOT}/${tweet.author.screen_name}">@${tweet.author.screen_name}</a>)</h4>`
      : ''
  });
};

export const renderInstantView = (properties: RenderProperties): ResponseInstructions => {
  console.log('Generating Instant View...');
  const { tweet, flags } = properties;
  const instructions: ResponseInstructions = { addHeaders: [] };
  /* Use ISO date for Medium template */
  const postDate = new Date(tweet.created_at).toISOString();

  /* Pretend to be Medium to allow Instant View to work.
     Thanks to https://nikstar.me/post/instant-view/ for the help!
    
     If you work for Telegram and want to let us build our own templates
     contact me https://t.me/dangeredwolf */
  instructions.addHeaders = [
    `<meta property="al:android:app_name" content="Medium"/>`,
    `<meta property="article:published_time" content="${postDate}"/>`,
    flags?.archive
      ? `<style>img,video{width:100%;max-width:500px}html{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif}</style>`
      : ``
  ];

  instructions.text = `
    <section class="section-backgroundImage">
      <figure class="graf--layoutFillWidth"></figure>
    </section>
    <section class="section--first">${
      flags?.archive
        ? `${Constants.BRANDING_NAME} archive`
        : 'If you can see this, your browser is doing something weird with your user agent.'
    } <a href="${tweet.url}">View original post</a>
    </section>
    <article>
    <sub><a href="${tweet.url}">View original</a></sub>
    <h1>${tweet.author.name} (@${tweet.author.screen_name})</h1>

    ${generateTweet(tweet)}
  </article>`;

  return instructions;
};

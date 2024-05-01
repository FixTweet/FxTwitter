/* eslint-disable no-irregular-whitespace */
import { Constants } from '../constants';
import { getSocialTextIV } from '../helpers/socialproof';
import { sanitizeText } from '../helpers/utils';
import { Strings } from '../strings';

enum AuthorActionType {
  Reply = 'Reply',
  Original = 'Original',
  FollowUp = 'FollowUp'
}

const populateUserLinks = (status: APIStatus, text: string): string => {
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

const generateStatusMedia = (status: APIStatus, author: APIUser): string => {
  let media = '';
  if (status.media?.all?.length) {
    status.media.all.forEach(mediaItem => {
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
          media += `<video src="${mediaItem.url}" alt="${author.name}'s video. Alt text not available."/>`;
          break;
        case 'gif':
          media += `<video src="${mediaItem.url}" alt="${author.name}'s gif. Alt text not available."/>`;
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
  const urlPattern = /\bhttps?:\/\/[\w.-]+\.\w+[/\w.-]*\w/g;
  return input.replace(urlPattern, url => {
    return `<a href="${wrapForeignLinks(url)}">${url}</a>`;
  });
};

const htmlifyHashtags = (input: string): string => {
  const hashtagPattern = /#([a-zA-Z_]\w*)/g;
  return input.replace(hashtagPattern, (match, hashtag) => {
    const encodedHashtag = encodeURIComponent(hashtag);
    return `  <a href="${Constants.TWITTER_ROOT}/hashtag/${encodedHashtag}?src=hashtag_click">${match}</a>  `;
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

function getTranslatedText(status: APITwitterStatus, isQuote = false): string | null {
  if (!status.translation) {
    return null;
  }
  let text = paragraphify(sanitizeText(status.translation?.text), isQuote);
  text = htmlifyLinks(text);
  text = htmlifyHashtags(text);
  text = populateUserLinks(status, text);

  const formatText =
    status.translation.target_lang === 'en'
      ? Strings.TRANSLATE_TEXT.format({
          language: status.translation.source_lang_en
        })
      : Strings.TRANSLATE_TEXT_INTL.format({
          source: status.translation.source_lang.toUpperCase(),
          destination: status.translation.target_lang.toUpperCase()
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

const generateInlineAuthorHeader = (
  status: APIStatus,
  author: APIUser,
  authorActionType: AuthorActionType | null
): string => {
  return `<h4><i><a href="${status.url}">{AuthorAction}</a> from <b>${author.name}</b> (<a href="${author.url}">@${author.screen_name}</a>):</i></h4>`.format(
    {
      AuthorAction:
        authorActionType === AuthorActionType.Reply
          ? 'Reply'
          : authorActionType === AuthorActionType.Original
            ? 'Original'
            : 'Follow-up'
    }
  );
};

const wrapForeignLinks = (url: string) => {
  let unwrap = false;
  const whitelistedDomains = ['twitter.com', 'x.com', 't.me', 'telegram.me'];
  try {
    const urlObj = new URL(url);

    if (!whitelistedDomains.includes(urlObj.hostname)) {
      unwrap = true;
    }
  } catch (error) {
    unwrap = true;
  }

  return unwrap
    ? `https://${Constants.API_HOST_LIST[0]}/2/hit?url=${encodeURIComponent(url)}`
    : url;
};

const generateStatusFooter = (status: APIStatus, isQuote = false, author: APIUser): string => {
  let description = author.description;
  description = htmlifyLinks(description);
  description = htmlifyHashtags(description);
  description = populateUserLinks(status, description);

  return `
    <p>{socialText}</p>
    <br>{viewOriginal}
    <!-- Embed profile picture, display name, and screen name in table -->
    {aboutSection}
    `.format({
    socialText: getSocialTextIV(status as APITwitterStatus) || '',
    viewOriginal: !isQuote ? `<a href="${status.url}">View full thread</a>` : notApplicableComment,
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
          {statuses} <b>Posts</b>
        </p>`.format({
          pfp: `<img src="${author.avatar_url?.replace('_200x200', '_400x400')}" alt="${
            author.name
          }'s profile picture" />`,
          location: author.location ? `📌 ${author.location}` : '',
          website: author.website
            ? `🔗 <a rel="nofollow" href="${wrapForeignLinks(author.website.url)}">${author.website.display_url}</a>`
            : '',
          joined: author.joined ? `📆 ${formatDate(new Date(author.joined))}` : '',
          following: truncateSocialCount(author.following),
          followers: truncateSocialCount(author.followers),
          statuses: truncateSocialCount(author.statuses)
        })
  });
};

const generatePoll = (poll: APIPoll, language: string): string => {
  const intlFormat = Intl.NumberFormat(language ?? 'en');
  let str = '';

  const barLength = 20;

  poll.choices.forEach(choice => {
    const bar = '█'.repeat((choice.percentage / 100) * barLength);
    // eslint-disable-next-line no-irregular-whitespace
    str += `${bar}<br>${choice.label}<br>${intlFormat.format(choice.count)} votes, ${intlFormat.format(choice.percentage)}%<br>`;
  });
  /* Finally, add the footer of the poll with # of votes and time left */
  str += `<br>${intlFormat.format(poll.total_votes)} votes · ${poll.time_left_en}`;

  return str;
};

const generateCommunityNote = (status: APITwitterStatus): string => {
  if (status.community_note) {
    console.log('community_note', status.community_note);
    const note = status.community_note;
    const entities = note.entities;
    entities.sort((a, b) => a.fromIndex - b.fromIndex); // sort entities by fromIndex

    let lastToIndex = 0;
    let result = '';

    entities.forEach(entity => {
      if (entity?.ref?.type !== 'TimelineUrl') {
        return;
      }
      const fromIndex = entity.fromIndex;
      const toIndex = entity.toIndex;
      const url = entity.ref.url;

      // Add the text before the link
      result += note.text.substring(lastToIndex, fromIndex);

      // Add the link
      result += `<a href="${url}">${note.text.substring(fromIndex, toIndex)}</a>`;

      lastToIndex = toIndex;
    });

    // Add the remaining text after the last link
    result = `<table>
      <thead>
        <th><b>Readers added context they thought people might want to know</b></th>
      </thead>
      <tbody>
        <th>${result.replace(/\n/g, '\n<br>')}</th>
      </tbody>
    </table>`;

    return result;
  }
  return '';
};

const generateStatus = (
  status: APIStatus,
  author: APIUser,
  isQuote = false,
  authorActionType: AuthorActionType | null
): string => {
  let text = paragraphify(sanitizeText(status.text), isQuote);
  text = htmlifyLinks(text);
  text = htmlifyHashtags(text);
  text = populateUserLinks(status, text);

  const translatedText = getTranslatedText(status as APITwitterStatus, isQuote);

  return `<!-- Telegram Instant View -->
  {quoteHeader}
  <!-- Embed media -->
  ${generateStatusMedia(status, author)} 
  <!-- Translated text (if applicable) -->
  ${translatedText ? translatedText : notApplicableComment}
  <!-- Inline author (if applicable) -->
  ${authorActionType ? generateInlineAuthorHeader(status, author, authorActionType) : ''}
  <!-- Embed Status text -->
  ${text}
  <!-- Embed Community Note -->
  ${generateCommunityNote(status as APITwitterStatus)}
  <!-- Embed poll -->
  ${status.poll ? generatePoll(status.poll, status.lang ?? 'en') : notApplicableComment}
  <!-- Embedded quote status -->
  ${!isQuote && status.quote ? generateStatus(status.quote, author, true, null) : notApplicableComment}
  `.format({
    quoteHeader: isQuote
      ? `<h4><a href="${status.url}">Quoting</a> ${status.author.name} (<a href="${Constants.TWITTER_ROOT}/${status.author.screen_name}">@${status.author.screen_name}</a>)</h4>`
      : ''
  });
};

export const renderInstantView = (properties: RenderProperties): ResponseInstructions => {
  console.log('Generating Instant View...');
  const { status, thread, flags } = properties;
  const instructions: ResponseInstructions = { addHeaders: [] };

  let previousThreadPieceAuthor: string | null = null;
  let originalAuthor: string | null = null;

  const useThread = thread?.thread ?? [thread?.status];

  if (!status) {
    throw new Error('Status is undefined');
  }

  /* Use ISO date for Medium template */
  const statusDate = new Date(status.created_at).toISOString();

  /* Pretend to be Medium to allow Instant View to work.
     Thanks to https://nikstar.me/post/instant-view/ for the help!
    
     If you work for Telegram and want to let us build our own templates
     contact me https://t.me/dangeredwolf */
  instructions.addHeaders = [
    `<meta property="al:android:app_name" content="Medium"/>`,
    `<meta property="article:published_time" content="${statusDate}"/>`,
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
    } <a href="${status.url}">View full thread</a>
    </section>
    <article>
    <sub><a href="${status.url}">View full thread</a></sub>
    <h1>${status.author.name} (@${status.author.screen_name})</h1>

    ${useThread
      .map(status => {
        console.log('previousThreadPieceAuthor', previousThreadPieceAuthor);
        if (!status) {
          return '';
        }
        if (originalAuthor === null) {
          originalAuthor = status.author?.id;
        }
        const differentAuthor =
          thread?.author?.id !== status.author?.id ||
          (previousThreadPieceAuthor !== null && previousThreadPieceAuthor !== status.author?.id);
        const isOriginal =
          thread?.author?.id !== status.author?.id && previousThreadPieceAuthor === null;
        const isFollowup =
          thread?.author?.id === status.author?.id &&
          previousThreadPieceAuthor !== null &&
          previousThreadPieceAuthor !== thread?.author?.id &&
          originalAuthor === status.author?.id;
        console.log('differentAuthor', differentAuthor);
        console.log('isOriginal', isOriginal);
        console.log('isFollowup', isFollowup);

        let authorAction = null;

        if (differentAuthor) {
          if (isFollowup) {
            authorAction = AuthorActionType.FollowUp;
          } else if (isOriginal) {
            authorAction = AuthorActionType.Original;
          } else if (previousThreadPieceAuthor !== status.author?.id) {
            authorAction = AuthorActionType.Reply;
          }
        }

        previousThreadPieceAuthor = status.author?.id;

        return generateStatus(status, status.author ?? thread?.author, false, authorAction);
      })
      .join('')}
    ${generateStatusFooter(status, false, thread?.author ?? status.author)}
    <br>${`<a href="${status.url}">View full thread</a>`}
  </article>`;

  return instructions;
};

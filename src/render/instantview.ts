import { Constants } from "../constants";
import { getSocialTextIV } from "../helpers/author";
import { sanitizeText } from "../helpers/utils";

const populateUserLinks = (tweet: APITweet, text: string): string => {
  /* TODO: Maybe we can add username splices to our API so only genuinely valid users are linked? */
  text.match(/@(\w{1,15})/g)?.forEach((match) => {
    const username = match.replace('@', '');
    text = text.replace(
      match,
      `<a href="${Constants.TWITTER_ROOT}/${username}" target="_blank" rel="noopener noreferrer">${match}</a>`
    );
  });
  return text;
}

const generateTweetMedia = (tweet: APITweet): string => {
  let media = '';
  if (tweet.media?.all?.length) {
    tweet.media.all.forEach((mediaItem) => {
      switch(mediaItem.type) {
        case 'photo':
          media += `<img src="${mediaItem.url}" alt="${tweet.author.name}'s photo" />`;
          break;
        case 'video':
          media += `<video src="${mediaItem.url}" alt="${tweet.author.name}'s video" />`;
          break;
        case 'gif':
          media += `<video src="${mediaItem.url}" alt="${tweet.author.name}'s gif" />`;
          break;
      }
    });
  }
  return media;
}

// const formatDateTime = (date: Date): string => {
//   const yyyy = date.getFullYear();
//   const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
//   const dd = String(date.getDate()).padStart(2, '0');
//   const hh = String(date.getHours()).padStart(2, '0');
//   const min = String(date.getMinutes()).padStart(2, '0');
//   return `${hh}:${min} - ${yyyy}/${mm}/${dd}`;
// }

const htmlifyLinks = (input: string): string => {
  const urlPattern = /\bhttps?:\/\/\S+/g;
  return input.replace(urlPattern, (url) => {
      return `<a href="${url}">${url}</a>`;
  });
}

export const renderInstantView = (properties: RenderProperties): ResponseInstructions => {
  console.log('Generating Instant View (placeholder)...');
  const { tweet } = properties;
  const instructions: ResponseInstructions = { addHeaders: [] };
  /* Use ISO date for Medium template */
  const postDate = new Date(tweet.created_at).toISOString();

  /* Include Instant-View related headers. This is an unfinished project. Thanks to https://nikstar.me/post/instant-view/ for the help! */
  instructions.addHeaders = [
    `<meta property="al:android:app_name" content="Medium"/>`,
    `<meta property="article:published_time" content="${postDate}"/>`
  ];

  let text = sanitizeText(tweet.text).replace(/\n/g, '<br>');
  text = populateUserLinks(tweet, text);
  text = htmlifyLinks(text);

  instructions.text = `
  <section class="section-backgroundImage">
    <figure class="graf--layoutFillWidth"></figure>
  </section>
  <section class="section--first" style="font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 64px;">
    If you can see this, your browser is doing something weird with your user agent. <a href="${tweet.url}">View original post</a>
  </section>
  <article>
  <h1>${tweet.author.name} (@${tweet.author.screen_name})</h1>
  <p>Instant View (✨ Beta) - <a href="${tweet.url}">View original</a></p> 

  <!--blockquote class="twitter-tweet" data-dnt="true"><p lang="en" dir="ltr"> <a href="${tweet.url}">_</a></blockquote-->

  <!-- Embed profile picture, display name, and screen name in table -->
  <table>
    <img src="${tweet.author.avatar_url}" alt="${tweet.author.name}'s profile picture" />
    <h2>${tweet.author.name}</h2>
    <p>@${tweet.author.screen_name}</p>
    <p>${getSocialTextIV(tweet)}</p>
  </table>

  <!-- Embed Tweet text -->
  <p>${text}</p>
  ${generateTweetMedia(tweet)} 
  <a href="${tweet.url}">View original</a>
</article>
`;

  return instructions;
};

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

  instructions.text = `<section class="section-backgroundImage"><figure class="graf--layoutFillWidth"></figure></section><article><h1>${tweet.author.name} (@${tweet.author.screen_name})</h1><p>Instant View (✨ Beta)</p>
  <blockquote class="twitter-tweet" data-dnt="true"><p lang="en" dir="ltr"> <a href="${tweet.url}">_</a></blockquote>
</article>
`;

  return instructions;
};

import { cacheWrapper } from '../src/server';

const botHeaders = { 'User-Agent': 'Discordbot/2.0' };
const humanHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
};
const githubUrl = 'https://github.com/dangeredwolf/FixTweet';

test('Home page redirect', async () => {
  const result = await cacheWrapper(
    new Request('https://fxtwitter.com', {
      method: 'GET',
      headers: botHeaders
    })
  );
  const resultHuman = await cacheWrapper(
    new Request('https://fxtwitter.com', {
      method: 'GET',
      headers: humanHeaders
    })
  );
  expect(result.status).toEqual(302);
  expect(result.headers.get('location')).toEqual(githubUrl);
  expect(resultHuman.status).toEqual(302);
  expect(resultHuman.headers.get('location')).toEqual(githubUrl);
});

test('Tweet redirect human', async () => {
  const result = await cacheWrapper(
    new Request('https://fxtwitter.com/jack/status/20', {
      method: 'GET',
      headers: humanHeaders
    })
  );
  expect(result.status).toEqual(302);
  expect(result.headers.get('location')).toEqual('https://twitter.com/jack/status/20');
});

test('Tweet response robot', async () => {
  const result = await cacheWrapper(
    new Request('https://fxtwitter.com/jack/status/20', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
});

test('API fetch basic Tweet', async () => {
  const result = await cacheWrapper(
    new Request('https://api.fxtwitter.com/status/20', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as APIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(200);
  expect(response.message).toEqual('OK');

  const tweet = response.tweet as APITweet;
  expect(tweet).toBeTruthy();
  expect(tweet.url).toEqual('https://twitter.com/jack/status/20');
  expect(tweet.id).toEqual('20');
  expect(tweet.text).toEqual('just setting up my twttr');
  expect(tweet.author.screen_name?.toLowerCase()).toEqual('jack');
  expect(tweet.author.name).toBeTruthy();
  expect(tweet.author.avatar_url).toBeTruthy();
  expect(tweet.author.banner_url).toBeTruthy();
  expect(tweet.author.avatar_color).toBeTruthy();
  expect(tweet.replies).toBeGreaterThan(0);
  expect(tweet.retweets).toBeGreaterThan(0);
  expect(tweet.likes).toBeGreaterThan(0);
  expect(tweet.twitter_card).toEqual('tweet');
  expect(tweet.created_at).toEqual('Tue Mar 21 20:50:14 +0000 2006');
  expect(tweet.created_timestamp).toEqual(1142974214);
  expect(tweet.lang).toEqual('en');
  expect(tweet.replying_to).toBeNull();
});

test('API fetch video Tweet', async () => {
  const result = await cacheWrapper(
    new Request('https://api.fxtwitter.com/Twitter/status/854416760933556224', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as APIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(200);
  expect(response.message).toEqual('OK');

  const tweet = response.tweet as APITweet;
  expect(tweet).toBeTruthy();
  expect(tweet.url).toEqual('https://twitter.com/Twitter/status/854416760933556224');
  expect(tweet.id).toEqual('854416760933556224');
  expect(tweet.text).toEqual(
    'Get the sauces ready, #NuggsForCarter has 3 million+ Retweets.'
  );
  expect(tweet.author.screen_name?.toLowerCase()).toEqual('twitter');
  expect(tweet.author.name).toBeTruthy();
  expect(tweet.author.avatar_url).toBeTruthy();
  expect(tweet.author.banner_url).toBeTruthy();
  expect(tweet.author.avatar_color).toBeTruthy();
  expect(tweet.replies).toBeGreaterThan(0);
  expect(tweet.retweets).toBeGreaterThan(0);
  expect(tweet.likes).toBeGreaterThan(0);
  expect(tweet.twitter_card).toEqual('player');
  expect(tweet.created_at).toEqual('Tue Apr 18 19:30:04 +0000 2017');
  expect(tweet.created_timestamp).toEqual(1492543804);
  expect(tweet.lang).toEqual('en');
  expect(tweet.replying_to).toBeNull();
  expect(tweet.media?.video).toBeTruthy();
  const video = tweet.media?.videos?.[0] as APIVideo;
  expect(video.url).toEqual(
    'https://video.twimg.com/amplify_video/854415175776059393/vid/720x720/dNEi0crU-jA4mTtr.mp4'
  );
  expect(video.thumbnail_url).toEqual('https://pbs.twimg.com/media/C9t-btLVoAEqZI1.jpg');
  expect(video.width).toEqual(1596);
  expect(video.height).toEqual(1600);
  expect(video.format).toEqual('video/mp4');
  expect(video.type).toEqual('video');
});

test('API fetch multi-photo Tweet', async () => {
  const result = await cacheWrapper(
    new Request('https://api.fxtwitter.com/dangeredwolf/status/1554870933449482240', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as APIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(200);
  expect(response.message).toEqual('OK');

  const tweet = response.tweet as APITweet;
  expect(tweet).toBeTruthy();
  expect(tweet.url).toEqual(
    'https://twitter.com/dangeredwolf/status/1554870933449482240'
  );
  expect(tweet.id).toEqual('1554870933449482240');
  expect(tweet.text).toEqual('4 photos');
  expect(tweet.author.screen_name?.toLowerCase()).toEqual('dangeredwolf');
  expect(tweet.author.name).toBeTruthy();
  expect(tweet.author.avatar_url).toBeTruthy();
  expect(tweet.author.banner_url).toBeTruthy();
  expect(tweet.author.avatar_color).toBeTruthy();
  expect(tweet.twitter_card).toEqual('summary_large_image');
  expect(tweet.created_at).toEqual('Wed Aug 03 16:44:53 +0000 2022');
  expect(tweet.created_timestamp).toEqual(1659545093);
  expect(tweet.replying_to).toBeNull();
  expect(tweet.media?.photos).toBeTruthy();
  const photos = tweet.media?.photos as APIPhoto[];
  expect(photos[0].url).toEqual('https://pbs.twimg.com/media/FZQCeMmXwAAOJTt.png');
  expect(photos[0].width).toEqual(800);
  expect(photos[0].height).toEqual(418);
  expect(photos[1].url).toEqual('https://pbs.twimg.com/media/FZQCl-lWIAMtoW9.png');
  expect(photos[1].width).toEqual(800);
  expect(photos[1].height).toEqual(418);
  expect(photos[2].url).toEqual('https://pbs.twimg.com/media/FZQCsQPX0AIbY6H.png');
  expect(photos[2].width).toEqual(800);
  expect(photos[2].height).toEqual(418);
  expect(photos[3].url).toEqual('https://pbs.twimg.com/media/FZQCxmLXEAMST4q.png');
  expect(photos[3].width).toEqual(800);
  expect(photos[3].height).toEqual(418);
  expect(tweet.media?.mosaic).toBeTruthy();
  const mosaic = tweet.media?.mosaic as APIMosaicPhoto;
  expect(mosaic.width).toEqual(1610);
  expect(mosaic.height).toEqual(846);
  expect(mosaic.formats?.jpeg).toEqual(
    'https://mosaic.fxtwitter.com/jpeg/1554870933449482240/FZQCeMmXwAAOJTt/FZQCl-lWIAMtoW9/FZQCsQPX0AIbY6H/FZQCxmLXEAMST4q'
  );
  expect(mosaic.formats?.webp).toEqual(
    'https://mosaic.fxtwitter.com/webp/1554870933449482240/FZQCeMmXwAAOJTt/FZQCl-lWIAMtoW9/FZQCsQPX0AIbY6H/FZQCxmLXEAMST4q'
  );
});

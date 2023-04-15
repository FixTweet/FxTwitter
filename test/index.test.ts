import { cacheWrapper } from '../src/server';

const botHeaders = { 'User-Agent': 'Discordbot/2.0' };
const humanHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
};
const githubUrl = 'https://github.com/FixTweet/FixTweet';

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

test('Twitter moment redirect', async () => {
  const result = await cacheWrapper(
    new Request(
      'https://fxtwitter.com/i/events/1572638642127966214?t=0UK7Ny-Jnsp-dUGzlb-M8w&s=35',
      {
        method: 'GET',
        headers: botHeaders
      }
    )
  );
  expect(result.status).toEqual(302);
  expect(result.headers.get('location')).toEqual(
    'https://twitter.com/i/events/1572638642127966214'
  );
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
  const response = (await result.json()) as TweetAPIResponse;
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
  const response = (await result.json()) as TweetAPIResponse;
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
  expect(video.duration).toEqual(65.667);
  expect(video.format).toEqual('video/mp4');
  expect(video.type).toEqual('video');
});

test('API fetch multi-photo Tweet', async () => {
  const result = await cacheWrapper(
    new Request('https://api.fxtwitter.com/Twitter/status/1445094085593866246', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as TweetAPIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(200);
  expect(response.message).toEqual('OK');

  const tweet = response.tweet as APITweet;
  expect(tweet).toBeTruthy();
  expect(tweet.url).toEqual('https://twitter.com/Twitter/status/1445094085593866246');
  expect(tweet.id).toEqual('1445094085593866246');
  expect(tweet.text).toEqual('@netflix');
  expect(tweet.author.screen_name?.toLowerCase()).toEqual('twitter');
  expect(tweet.author.name).toBeTruthy();
  expect(tweet.author.avatar_url).toBeTruthy();
  expect(tweet.author.banner_url).toBeTruthy();
  expect(tweet.author.avatar_color).toBeTruthy();
  expect(tweet.twitter_card).toEqual('summary_large_image');
  expect(tweet.created_at).toEqual('Mon Oct 04 18:30:53 +0000 2021');
  expect(tweet.created_timestamp).toEqual(1633372253);
  expect(tweet.replying_to?.toLowerCase()).toEqual('netflix');
  expect(tweet.media?.photos).toBeTruthy();
  const photos = tweet.media?.photos as APIPhoto[];
  expect(photos[0].url).toEqual('https://pbs.twimg.com/media/FA4BaFaXoBUV3di.jpg');
  expect(photos[0].width).toEqual(950);
  expect(photos[0].height).toEqual(620);
  expect(photos[1].url).toEqual('https://pbs.twimg.com/media/FA4BaUyXEAcAHvK.jpg');
  expect(photos[1].width).toEqual(1386);
  expect(photos[1].height).toEqual(706);
  expect(tweet.media?.mosaic).toBeTruthy();
  const mosaic = tweet.media?.mosaic as APIMosaicPhoto;
  expect(mosaic.formats?.jpeg).toEqual(
    'https://mosaic.fxtwitter.com/jpeg/1445094085593866246/FA4BaFaXoBUV3di/FA4BaUyXEAcAHvK'
  );
  expect(mosaic.formats?.webp).toEqual(
    'https://mosaic.fxtwitter.com/webp/1445094085593866246/FA4BaFaXoBUV3di/FA4BaUyXEAcAHvK'
  );
});

// test('API fetch multi-video Tweet', async () => {
//   const result = await cacheWrapper(
//     new Request('https://api.fxtwitter.com/dangeredwolf/status/1557914172763127808', {
//       method: 'GET',
//       headers: botHeaders
//     })
//   );
//   expect(result.status).toEqual(200);
//   const response = (await result.json()) as TweetAPIResponse;
//   expect(response).toBeTruthy();
//   expect(response.code).toEqual(200);
//   expect(response.message).toEqual('OK');

//   const tweet = response.tweet as APITweet;
//   expect(tweet).toBeTruthy();
//   expect(tweet.url).toEqual(
//     'https://twitter.com/dangeredwolf/status/1557914172763127808'
//   );
//   expect(tweet.id).toEqual('1557914172763127808');
//   expect(tweet.text).toEqual('');
//   expect(tweet.author.screen_name?.toLowerCase()).toEqual('dangeredwolf');
//   expect(tweet.author.name).toBeTruthy();
//   expect(tweet.author.avatar_url).toBeTruthy();
//   expect(tweet.author.banner_url).toBeTruthy();
//   expect(tweet.author.avatar_color).toBeTruthy();
//   expect(tweet.twitter_card).toEqual('player');
//   expect(tweet.created_at).toEqual('Fri Aug 12 02:17:38 +0000 2022');
//   expect(tweet.created_timestamp).toEqual(1660270658);
//   expect(tweet.replying_to).toBeNull();
//   expect(tweet.media?.videos).toBeTruthy();
//   const videos = tweet.media?.videos as APIVideo[];
//   expect(videos[0].url).toEqual(
//     'https://video.twimg.com/ext_tw_video/1539029945124528130/pu/vid/1662x1080/ZQP4eoQhnGnKcLEb.mp4?tag=14'
//   );
//   expect(videos[0].thumbnail_url).toEqual(
//     'https://pbs.twimg.com/ext_tw_video_thumb/1539029945124528130/pu/img/6Z1MXMliums60j03.jpg'
//   );
//   expect(videos[0].width).toEqual(3548);
//   expect(videos[0].height).toEqual(2304);
//   expect(videos[0].duration).toEqual(37.75);
//   expect(videos[0].format).toEqual('video/mp4');
//   expect(videos[0].type).toEqual('video');
//   expect(videos[1].url).toEqual(
//     'https://video.twimg.com/ext_tw_video/1543316856697769984/pu/vid/1920x1080/3fo7b4EnWv2WO8Z1.mp4?tag=14'
//   );
//   expect(videos[1].thumbnail_url).toEqual(
//     'https://pbs.twimg.com/ext_tw_video_thumb/1543316856697769984/pu/img/eCl67JRWO8r4r8A4.jpg'
//   );
//   expect(videos[1].width).toEqual(1920);
//   expect(videos[1].height).toEqual(1080);
//   expect(videos[1].duration).toEqual(71.855);
//   expect(videos[1].format).toEqual('video/mp4');
//   expect(videos[1].type).toEqual('video');
//   expect(videos[2].url).toEqual(
//     'https://video.twimg.com/ext_tw_video/1543797953105625088/pu/vid/1920x1080/GHSLxzBrwiDLhLYD.mp4?tag=14'
//   );
//   expect(videos[2].thumbnail_url).toEqual(
//     'https://pbs.twimg.com/ext_tw_video_thumb/1543797953105625088/pu/img/2eX2QQkd7b2S1YDl.jpg'
//   );
//   expect(videos[2].width).toEqual(1920);
//   expect(videos[2].height).toEqual(1080);
//   expect(videos[2].duration).toEqual(22.018);
//   expect(videos[2].format).toEqual('video/mp4');
//   expect(videos[2].type).toEqual('video');
//   expect(videos[3].url).toEqual(
//     'https://video.twimg.com/ext_tw_video/1548602342488129536/pu/vid/720x1280/I_D3svYfjBl7_xGS.mp4?tag=14'
//   );
//   expect(videos[3].thumbnail_url).toEqual(
//     'https://pbs.twimg.com/ext_tw_video_thumb/1548602342488129536/pu/img/V_1u5Nv5BwKBynwv.jpg'
//   );
//   expect(videos[3].width).toEqual(720);
//   expect(videos[3].height).toEqual(1280);
//   expect(videos[3].duration).toEqual(25.133);
//   expect(videos[3].format).toEqual('video/mp4');
//   expect(videos[3].type).toEqual('video');
// });

test('API fetch poll Tweet', async () => {
  const result = await cacheWrapper(
    new Request('https://api.fxtwitter.com/status/1055475950543167488', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as TweetAPIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(200);
  expect(response.message).toEqual('OK');

  const tweet = response.tweet as APITweet;
  expect(tweet).toBeTruthy();
  expect(tweet.url).toEqual('https://twitter.com/Twitter/status/1055475950543167488');
  expect(tweet.id).toEqual('1055475950543167488');
  expect(tweet.text).toEqual('A poll:');
  expect(tweet.author.screen_name?.toLowerCase()).toEqual('twitter');
  expect(tweet.author.name).toBeTruthy();
  expect(tweet.author.avatar_url).toBeTruthy();
  expect(tweet.author.banner_url).toBeTruthy();
  expect(tweet.author.avatar_color).toBeTruthy();
  expect(tweet.twitter_card).toEqual('tweet');
  expect(tweet.created_at).toEqual('Thu Oct 25 15:07:31 +0000 2018');
  expect(tweet.created_timestamp).toEqual(1540480051);
  expect(tweet.lang).toEqual('en');
  expect(tweet.replying_to).toBeNull();
  expect(tweet.poll).toBeTruthy();
  const poll = tweet.poll as APIPoll;
  expect(poll.ends_at).toEqual('2018-10-26T03:07:30Z');
  expect(poll.time_left_en).toEqual('Final results');
  expect(poll.total_votes).toEqual(54703);

  const choices = poll.choices as APIPollChoice[];
  expect(choices[0].label).toEqual('Yesssss');
  expect(choices[0].count).toEqual(14773);
  expect(choices[0].percentage).toEqual(27);
  expect(choices[1].label).toEqual('No');
  expect(choices[1].count).toEqual(3618);
  expect(choices[1].percentage).toEqual(6.6);
  expect(choices[2].label).toEqual('Maybe?');
  expect(choices[2].count).toEqual(4606);
  expect(choices[2].percentage).toEqual(8.4);
  expect(choices[3].label).toEqual('Just show me the results');
  expect(choices[3].count).toEqual(31706);
  expect(choices[3].percentage).toEqual(58);
});

test.only('API fetch user', async () => {
  const result = await cacheWrapper(
    new Request('https://api.fxtwitter.com/wazbat', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as UserAPIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(200);
  expect(response.message).toEqual('OK');

  const user = response.user as APIUser;
  expect(user).toBeTruthy();
  expect(user.url).toEqual('https://twitter.com/wazbat');
  expect(user.id).toEqual('157658332');
  expect(user.name).toEqual('Wazbat');
  expect(user.screen_name).toEqual('wazbat');
  expect(user.location).toEqual('Behind you');
  expect(user.followers).toBeGreaterThanOrEqual(1_000);
  expect(user.followers).toBeLessThanOrEqual(100_000);
  expect(user.following).toBeGreaterThanOrEqual(10);
  expect(user.following).toBeLessThanOrEqual(1_000);
  expect(user.likes).toBeGreaterThanOrEqual(10_000);
  expect(user.verified).toEqual(false);
  expect(user.joined).toEqual('Sun Jun 20 13:29:36 +0000 2010');
  expect(user.birthday.day).toEqual(14);
  expect(user.birthday.month).toEqual(7);
  expect(user.birthday.year).toBeUndefined();
});

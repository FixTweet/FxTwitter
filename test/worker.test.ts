import { APITwitterStatus, APIUser, TweetAPIResponse, UserAPIResponse } from '../src/types/types';
import { app } from '../src/worker';

const botHeaders = { 'User-Agent': 'Discordbot/2.0' };
const humanHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
};
const githubUrl = 'https://github.com/FixTweet/FxTwitter';
const twitterBaseUrl = 'https://twitter.com';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Performance not included in miniflare environment
if (!globalThis.performance) {
  // @ts-expect-error - Performance not included in jest environment
  globalThis.performance = {};
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Performance not included in miniflare environment
if (!globalThis.performance.now) {
  // eslint-disable-next-line no-var
  var start = Date.now();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Performance not included in miniflare environment
  globalThis.performance.now = function () {
    return Date.now() - start;
  };
}

test('Home page redirect', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com', {
      method: 'GET',
      headers: botHeaders
    })
  );
  const resultHuman = await app.request(
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

test('Status redirect human', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/jack/status/20', {
      method: 'GET',
      headers: humanHeaders
    })
  );
  expect(result.status).toEqual(302);
  expect(result.headers.get('location')).toEqual('https://twitter.com/jack/status/20');
});

test('Status redirect human trailing slash', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/jack/status/20/', {
      method: 'GET',
      headers: humanHeaders
    })
  );
  expect(result.status).toEqual(302);
  expect(result.headers.get('location')).toEqual('https://twitter.com/jack/status/20');
});

test('Status redirect human custom base redirect', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/jack/status/20', {
      method: 'GET',
      headers: {
        ...humanHeaders,
        Cookie: 'cf_clearance=a; base_redirect=https://nitter.net'
      }
    })
  );
  expect(result.status).toEqual(302);
  expect(result.headers.get('location')).toEqual('https://nitter.net/jack/status/20');
});

test('Twitter moment redirect', async () => {
  const result = await app.request(
    new Request(
      'https://fxtwitter.com/i/events/1572638642127966214?t=0UK7Ny-Jnsp-dUGzlb-M8w&s=35',
      {
        method: 'GET',
        headers: botHeaders
      }
    )
  );
  expect(result.status).toEqual(302);
  expect(result.headers.get('location')).toEqual(`${twitterBaseUrl}/i/events/1572638642127966214`);
});

test('Status response robot', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/jack/status/20', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
});

test('Status response robot (trailing slash/query string and extra characters)', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/jack/status/20||/?asdf=ghjk&klop;', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(200);
});

test('API fetch basic Status', async () => {
  const result = await app.request(
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

  const status = response.tweet as APITwitterStatus;
  expect(status).toBeTruthy();
  expect(status.url).toEqual(`${twitterBaseUrl}/jack/status/20`);
  expect(status.id).toEqual('20');
  expect(status.text).toEqual('just setting up my twttr');
  expect(status.author.screen_name?.toLowerCase()).toEqual('jack');
  expect(status.author.id).toEqual('12');
  expect(status.author.name).toBeTruthy();
  expect(status.author.avatar_url).toBeTruthy();
  expect(status.author.banner_url).toBeTruthy();
  // The reply count now returns 0 as of some time between Sep 17-19 2024 from guest API. No idea why.
  // expect(status.replies).toBeGreaterThan(0);
  // @ts-expect-error retweets only in legacy API
  expect(status.retweets).toBeGreaterThan(0);
  expect(status.likes).toBeGreaterThan(0);
  // @ts-expect-error twitter_card only in legacy API
  expect(status.twitter_card).toEqual('tweet');
  expect(status.created_at).toEqual('Tue Mar 21 20:50:14 +0000 2006');
  expect(status.created_timestamp).toEqual(1142974214);
  expect(status.lang).toEqual('en');
  expect(status.replying_to).toBeNull();
});

// test('API fetch video Status', async () => {
//   const result = await app.request(
//     new Request('https://api.fxtwitter.com/X/status/854416760933556224', {
//       method: 'GET',
//       headers: botHeaders
//     })
//   );
//   expect(result.status).toEqual(200);
//   const response = (await result.json()) as TweetAPIResponse;
//   expect(response).toBeTruthy();
//   expect(response.code).toEqual(200);
//   expect(response.message).toEqual('OK');

//   const status = response.tweet as APITwitterStatus;
//   expect(status).toBeTruthy();
//   expect(status.url).toEqual(`${twitterBaseUrl}/X/status/854416760933556224`);
//   expect(status.id).toEqual('854416760933556224');
//   expect(status.text).toEqual(
//     'Get the sauces ready, #NuggsForCarter has 3 million+ Retweets.'
//   );
//   expect(status.author.screen_name?.toLowerCase()).toEqual('x');
//   expect(status.author.id).toEqual('783214');
//   expect(status.author.name).toBeTruthy();
//   expect(status.author.avatar_url).toBeTruthy();
//   expect(status.author.banner_url).toBeTruthy();
//   expect(status.replies).toBeGreaterThan(0);
//   expect(status.retweets).toBeGreaterThan(0);
//   expect(status.likes).toBeGreaterThan(0);
//   expect(status.twitter_card).toEqual('player');
//   expect(status.created_at).toEqual('Tue Apr 18 19:30:04 +0000 2017');
//   expect(status.created_timestamp).toEqual(1492543804);
//   expect(status.lang).toEqual('en');
//   expect(status.replying_to).toBeNull();
//   const video = status.media?.videos?.[0] as APIVideo;
//   expect(video.url).toEqual(
//     'https://video.twimg.com/amplify_video/854415175776059393/vid/720x720/dNEi0crU-jA4mTtr.mp4'
//   );
//   expect(video.thumbnail_url).toEqual('https://pbs.twimg.com/media/C9t-btLVoAEqZI1.jpg');
//   expect(video.width).toEqual(1596);
//   expect(video.height).toEqual(1600);
//   expect(video.duration).toEqual(65.667);
//   expect(video.format).toEqual('video/mp4');
//   expect(video.type).toEqual('video');
// });

// test('API fetch multi-photo status', async () => {
//   const result = await app.request(
//     new Request('https://api.fxtwitter.com/Twitter/status/1445094085593866246', {
//       method: 'GET',
//       headers: botHeaders
//     })
//   );
//   expect(result.status).toEqual(200);
//   const response = (await result.json()) as TweetAPIResponse;
//   expect(response).toBeTruthy();
//   expect(response.code).toEqual(200);
//   expect(response.message).toEqual('OK');

//   const status = response.tweet as APITwitterStatus;
//   expect(status).toBeTruthy();
//   expect(status.url).toEqual(`${twitterBaseUrl}/X/status/1445094085593866246`);
//   expect(status.id).toEqual('1445094085593866246');
//   expect(status.text).toEqual('@netflix');
//   expect(status.author.screen_name?.toLowerCase()).toEqual('x');
//   expect(status.author.id).toEqual('783214');
//   expect(status.author.name).toBeTruthy();
//   expect(status.author.avatar_url).toBeTruthy();
//   expect(status.author.banner_url).toBeTruthy();
//   expect(status.twitter_card).toEqual('summary_large_image');
//   expect(status.created_at).toEqual('Mon Oct 04 18:30:53 +0000 2021');
//   expect(status.created_timestamp).toEqual(1633372253);
//   expect(status.replying_to?.toLowerCase()).toEqual('netflix');
//   expect(status.media?.photos).toBeTruthy();
//   const photos = status.media?.photos as APIPhoto[];
//   expect(photos[0].url).toEqual('https://pbs.twimg.com/media/FA4BaFaXoBUV3di.jpg');
//   expect(photos[0].width).toEqual(950);
//   expect(photos[0].height).toEqual(620);
//   expect(photos[0].altText).toBeTruthy();
//   expect(photos[1].url).toEqual('https://pbs.twimg.com/media/FA4BaUyXEAcAHvK.jpg');
//   expect(photos[1].width).toEqual(1386);
//   expect(photos[1].height).toEqual(706);
//   expect(photos[1].altText).toBeTruthy();
//   expect(status.media?.mosaic).toBeTruthy();
//   const mosaic = status.media?.mosaic as APIMosaicPhoto;
//   expect(mosaic.formats?.jpeg).toEqual(
//     'https://mosaic.fxtwitter.com/jpeg/1445094085593866246/FA4BaFaXoBUV3di/FA4BaUyXEAcAHvK'
//   );
//   expect(mosaic.formats?.webp).toEqual(
//     'https://mosaic.fxtwitter.com/webp/1445094085593866246/FA4BaFaXoBUV3di/FA4BaUyXEAcAHvK'
//   );
// });

// test('API fetch poll status', async () => {
//   const result = await app.request(
//     new Request('https://api.fxtwitter.com/status/1055475950543167488', {
//       method: 'GET',
//       headers: botHeaders
//     })
//   );
//   expect(result.status).toEqual(200);
//   const response = (await result.json()) as TweetAPIResponse;
//   expect(response).toBeTruthy();
//   expect(response.code).toEqual(200);
//   expect(response.message).toEqual('OK');

//   const status = response.tweet as APITwitterStatus;
//   expect(status).toBeTruthy();
//   expect(status.url).toEqual(`${twitterBaseUrl}/X/status/1055475950543167488`);
//   expect(status.id).toEqual('1055475950543167488');
//   expect(status.text).toEqual('A poll:');
//   expect(status.author.screen_name?.toLowerCase()).toEqual('x');
//   expect(status.author.id).toEqual('783214');
//   expect(status.author.name).toBeTruthy();
//   expect(status.author.avatar_url).toBeTruthy();
//   expect(status.author.banner_url).toBeTruthy();
//   expect(status.twitter_card).toEqual('tweet');
//   expect(status.created_at).toEqual('Thu Oct 25 15:07:31 +0000 2018');
//   expect(status.created_timestamp).toEqual(1540480051);
//   expect(status.lang).toEqual('en');
//   expect(status.replying_to).toBeNull();
//   expect(status.poll).toBeTruthy();
//   const poll = status.poll as APIPoll;
//   expect(poll.ends_at).toEqual('2018-10-26T03:07:30Z');
//   expect(poll.time_left_en).toEqual('Final results');
//   expect(poll.total_votes).toEqual(54703);

//   const choices = poll.choices as APIPollChoice[];
//   expect(choices[0].label).toEqual('Yesssss');
//   expect(choices[0].count).toEqual(14773);
//   expect(choices[0].percentage).toEqual(27);
//   expect(choices[1].label).toEqual('No');
//   expect(choices[1].count).toEqual(3618);
//   expect(choices[1].percentage).toEqual(6.6);
//   expect(choices[2].label).toEqual('Maybe?');
//   expect(choices[2].count).toEqual(4606);
//   expect(choices[2].percentage).toEqual(8.4);
//   expect(choices[3].label).toEqual('Just show me the results');
//   expect(choices[3].count).toEqual(31706);
//   expect(choices[3].percentage).toEqual(58);
// });

test('API fetch user', async () => {
  const result = await app.request(
    new Request('https://api.fxtwitter.com/x', {
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
  expect(user.url).toEqual(`${twitterBaseUrl}/X`);
  expect(user.id).toEqual('783214');
  expect(user.screen_name).toEqual('X');
  expect(user.followers).toEqual(expect.any(Number));
  expect(user.following).toEqual(expect.any(Number));
  // The official twitter account will never be following as many people as it has followers
  expect(user.following).not.toEqual(user.followers);
  expect(user.likes).toEqual(expect.any(Number));
  // expect(user.verified).toEqual('business');
  expect(user.joined).toEqual('Tue Feb 20 14:35:54 +0000 2007');
  // expect(user.birthday.day).toEqual(21);
  // expect(user.birthday.month).toEqual(3);
  // expect(user.birthday.year).toBeUndefined();
});

test('API fetch user that does not exist', async () => {
  const result = await app.request(
    new Request('https://api.fxtwitter.com/usesaahah123', {
      method: 'GET',
      headers: botHeaders
    })
  );
  expect(result.status).toEqual(404);
  const response = (await result.json()) as UserAPIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(404);
  expect(response.message).toEqual('User not found');
  expect(response.user).toBeUndefined();
});

import { ActivityStatus } from '../src/types/types';
import { app } from '../src/worker';
import { expect, test } from 'vitest';
import envWrapper from './helpers/env-wrapper';
import { botHeaders, twitterBaseUrl } from './helpers/data';


test('Status activity basic status', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/api/v1/statuses/6608666766545266', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as ActivityStatus;
  expect(response).toBeTruthy();
  expect(response.id).toEqual('20');
  expect(response.url).toEqual(`${twitterBaseUrl}/jack/status/20`);
  expect(response.uri).toEqual(`${twitterBaseUrl}/jack/status/20`);
  expect(response.created_at).toEqual('2006-03-21T20:50:14.000Z');
  expect(response.edited_at).toBeNull();
  expect(response.reblog).toBeNull();
  expect(response.application).toEqual({
    name: "Twitter Web Client",
    website: null
  });
  expect(response.content).toMatch(/just setting up my twttr/);
  expect(response.account.id).toEqual('12');
  expect(response.account.display_name).toEqual('jack');
  expect(response.account.username).toEqual('jack');
  expect(response.account.avatar).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.avatar_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.header).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.header_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.followers_count).toBeGreaterThan(0);
  expect(response.account.following_count).toBeGreaterThan(0);
  expect(response.account.statuses_count).toBeGreaterThan(0);
  expect(response.account.created_at).toEqual('2006-03-21T20:50:14.000Z');
  expect(response.account.locked).toEqual(false);
  expect(response.account.bot).toEqual(false);
  expect(response.account.emojis).toEqual([]);
  expect(response.account.roles).toEqual([]);
  expect(response.account.fields).toEqual([]);
  expect(response.media_attachments).toEqual([]);
  expect(response.mentions).toEqual([]);
  expect(response.tags).toEqual([]);
  expect(response.spoiler_text).toEqual('');
  expect(response.visibility).toEqual('public');
  expect(response.poll).toBeNull();
  expect(response.card).toBeNull();
});

test('Status activity video status', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/api/v1/statuses/66086667665360565354525854595752606054615254596166', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as ActivityStatus;
  expect(response).toBeTruthy();
  expect(response.id).toEqual('1841206275088290279');
  expect(response.url).toEqual(`${twitterBaseUrl}/DivineDropbear/status/1841206275088290279`);
  expect(response.uri).toEqual(`${twitterBaseUrl}/DivineDropbear/status/1841206275088290279`);
  expect(response.created_at).toEqual('2024-10-01T19:59:18.000Z');
  expect(response.edited_at).toBeNull();
  expect(response.reblog).toBeNull();
  expect(response.content).toMatch(/Sulphur-crested Cockatoo enjoying the warm Brisbane breeze\.\.\./);
  expect(response.content).toMatch(/<a href="https:\/\/x\.com\/fred_od_photo">@fred_od_photo<\/a>/);
  expect(response.content).toMatch(/<a href="https:\/\/x\.com\/hashtag\/birdphotography">#birdphotography<\/a>/);
  expect(response.account.id).toEqual('974067190386147329');
  expect(response.account.display_name).toEqual('Tranquility Found');
  expect(response.account.username).toEqual('DivineDropbear');
  expect(response.account.avatar).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.media_attachments).toBeTruthy();
  expect(response.media_attachments.length).toEqual(1);
  expect(response.media_attachments[0].id).toEqual('114163769487684704');
  expect(response.media_attachments[0].type).toEqual('video');
  expect(response.media_attachments[0].preview_url).toEqual('https://pbs.twimg.com/ext_tw_video_thumb/1841204388993646595/pu/img/KKN8tSQm60z2FmtE.jpg');
  expect(response.media_attachments[0].meta).toBeTruthy();
  expect(response.media_attachments[0].meta?.original?.width).toEqual(3840);
  expect(response.media_attachments[0].meta?.original?.height).toEqual(2160);
  expect(response.media_attachments[0].meta?.original?.size).toEqual('3840x2160');
  expect(response.media_attachments[0].meta?.original?.aspect).toEqual(1.7777777777777777);

  expect(response.media_attachments[0].url).toContain('video.twimg.com');
  expect(response.media_attachments[0].remote_url).toBeNull();
  expect(response.media_attachments[0].preview_remote_url).toBeNull();
  expect(response.media_attachments[0].text_url).toBeNull();
});

test('Status activity mosaic status', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/api/v1/statuses/66086667665360566060555357615752535656576157535566', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as ActivityStatus;
  expect(response).toBeTruthy();
  expect(response.id).toEqual('1848831595014459513');
  expect(response.url).toEqual(`${twitterBaseUrl}/SpaceX/status/1848831595014459513`);
  expect(response.content).toMatch(/Flight 6 Super Heavy booster moved to the Starbase pad for testing\. The move comes just one week after returning the first booster caught following launch/);
  expect(response.media_attachments).toBeTruthy();
  expect(response.media_attachments.length).toEqual(1);
  expect(response.media_attachments[0].type).toEqual('image');
  expect(response.media_attachments[0].url).toEqual('https://mosaic.fxtwitter.com/jpeg/1848831595014459513/GahebgHbEAEevTU/GahecZ5aAAEX7GX/GaheddqbsAAzGXg');
  expect(response.account.username).toEqual('SpaceX');
  expect(response.account.display_name).toEqual('SpaceX');
  expect(response.account.created_at).toEqual('2009-04-23T21:53:30.000Z');
  expect(response.account.avatar).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.avatar_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.header).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.header_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.followers_count).toBeGreaterThan(0);
  expect(response.account.following_count).toBeGreaterThan(0);
  expect(response.account.statuses_count).toBeGreaterThan(0);
});


test('Status activity select image 1', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/api/v1/statuses/66086667665360566060555357615752535656576157535566686613666753', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as ActivityStatus;
  expect(response).toBeTruthy();
  expect(response.id).toEqual('1848831595014459513');
  expect(response.url).toEqual(`${twitterBaseUrl}/SpaceX/status/1848831595014459513`);
  expect(response.content).toMatch(/Flight 6 Super Heavy booster moved to the Starbase pad for testing\. The move comes just one week after returning the first booster caught following launch/);
  expect(response.media_attachments).toBeTruthy();
  expect(response.media_attachments.length).toEqual(1);
  expect(response.media_attachments[0].type).toEqual('image');
  expect(response.media_attachments[0].url).toEqual('https://pbs.twimg.com/media/GahebgHbEAEevTU.jpg');
  expect(response.account.username).toEqual('SpaceX');
  expect(response.account.display_name).toEqual('SpaceX');
  expect(response.account.created_at).toEqual('2009-04-23T21:53:30.000Z');
  expect(response.account.avatar).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.avatar_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.header).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.header_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.followers_count).toBeGreaterThan(0);
  expect(response.account.following_count).toBeGreaterThan(0);
  expect(response.account.statuses_count).toBeGreaterThan(0);
});

test('Status activity select non-existing image', async () => {
  const result = await app.request(
    new Request('https://fxtwitter.com/api/v1/statuses/66086667665360566060555357615752535656576157535566686613666756', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
  );
  expect(result.status).toEqual(200);
  const response = (await result.json()) as ActivityStatus;
  expect(response).toBeTruthy();
  expect(response.id).toEqual('1848831595014459513');
  expect(response.url).toEqual(`${twitterBaseUrl}/SpaceX/status/1848831595014459513`);
  expect(response.content).toMatch(/Flight 6 Super Heavy booster moved to the Starbase pad for testing\. The move comes just one week after returning the first booster caught following launch/);
  expect(response.media_attachments).toBeTruthy();
  expect(response.media_attachments.length).toEqual(1);
  expect(response.media_attachments[0].type).toEqual('image');
  expect(response.media_attachments[0].url).toEqual('https://mosaic.fxtwitter.com/jpeg/1848831595014459513/GahebgHbEAEevTU/GahecZ5aAAEX7GX/GaheddqbsAAzGXg');
  expect(response.account.username).toEqual('SpaceX');
  expect(response.account.display_name).toEqual('SpaceX');
  expect(response.account.created_at).toEqual('2009-04-23T21:53:30.000Z');
  expect(response.account.avatar).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.avatar_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_images\/.+\.jpg/);
  expect(response.account.header).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.header_static).toMatch(/https:\/\/pbs\.twimg\.com\/profile_banners\/.+/);
  expect(response.account.followers_count).toBeGreaterThan(0);
  expect(response.account.following_count).toBeGreaterThan(0);
  expect(response.account.statuses_count).toBeGreaterThan(0);
});

import { ActivityStatus } from '../src/types/types';
import { app } from '../src/worker';
import { expect, test } from 'vitest';
import envWrapper from './helpers/env-wrapper';
import { botHeaders } from './helpers/data';


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
  expect(response.created_at).toEqual('2006-03-21T20:50:14.000Z');
  expect(response.edited_at).toBeNull();
  expect(response.reblog).toBeNull();
  expect(response.application).toEqual({
    name: "Twitter Web Client",
    website: null
  });
});
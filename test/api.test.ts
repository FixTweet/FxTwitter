import { test, expect } from "vitest";
import { UserAPIResponse, APIUser, TweetAPIResponse, APITwitterStatus } from "../src/types/types";
import { app } from "../src/worker";
import { botHeaders, twitterBaseUrl } from "./helpers/data";
import envWrapper from "./helpers/env-wrapper";

test('API fetch user', async () => {
  const result = await app.request(
    new Request('https://api.fxtwitter.com/x', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
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
    new Request('https://api.fxtwitter.com/notfound3842342', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
  );
  expect(result.status).toEqual(404);
  const response = (await result.json()) as UserAPIResponse;
  expect(response).toBeTruthy();
  expect(response.code).toEqual(404);
  expect(response.message).toEqual('User not found');
  expect(response.user).toBeUndefined();
});

test('API fetch basic Status', async () => {
  const result = await app.request(
    new Request('https://api.fxtwitter.com/status/20', {
      method: 'GET',
      headers: botHeaders
    }), undefined, envWrapper
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
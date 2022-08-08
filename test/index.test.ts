import { cacheWrapper } from '../src/server';

const botHeaders = { 'User-Agent': 'Discordbot/2.0' };
const humanHeaders = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
};

describe('handle', () => {
  test('Home page redirect', async () => {
    const result = await cacheWrapper(
      new Request('https://fxtwitter.com', { method: 'GET' })
    );
    expect(result.status).toEqual(302);
    expect(result.headers.get('location')).toEqual(
      'https://github.com/dangeredwolf/FixTweet'
    );
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
});

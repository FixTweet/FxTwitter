const fakeChromeVersion = '103';

export const Constants = {
  REDIRECT_URL: 'https://github.com/dangeredwolf',
  TWITTER_ROOT: 'https://twitter.com',
  GUEST_BEARER_TOKEN: `Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA`,
  BASE_HEADERS: {
    'sec-ch-ua': `".Not/A)Brand";v="99", "Google Chrome";v="${fakeChromeVersion}", "Chromium";v="${fakeChromeVersion}"`,
    DNT: `1`,
    'x-twitter-client-language': `en`,
    'sec-ch-ua-mobile': `?0`,
    'content-type': `application/x-www-form-urlencoded`,
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fakeChromeVersion}.0.0.0 Safari/537.36`,
    'x-twitter-active-user': `yes`,
    'sec-ch-ua-platform': `"Windows"`,
    Accept: `*/*`,
    Origin: `https://twitter.com`,
    'Sec-Fetch-Site': `same-site`,
    'Sec-Fetch-Mode': `cors`,
    'Sec-Fetch-Dest': `empty`,
    Referer: `https://twitter.com/`,
    'Accept-Encoding': `gzip, deflate, br`,
    'Accept-Language': `en`,
  },
};

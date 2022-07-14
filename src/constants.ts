const fakeChromeVersion = '103';

export const Constants = {
  REDIRECT_URL: 'https://twitter.com/dangeredwolf',
  TWITTER_ROOT: 'https://twitter.com',
  TWITTER_API_ROOT: 'https://api.twitter.com',
  GUEST_BEARER_TOKEN: `Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA`,
  GUEST_FETCH_PARAMETERS: [
    'cards_platform=Web-12',
    'include_cards=1',
    'include_ext_alt_text=true',
    'include_quote_count=true',
    'include_reply_count=1',
    'tweet_mode=extended',
    'include_ext_media_color=true',
    'include_ext_media_availability=true',
    'include_ext_sensitive_media_warning=true',
    'simple_quoted_tweet=true',
  ].join('&'),
  BASE_HEADERS: {
    'sec-ch-ua': `".Not/A)Brand";v="99", "Google Chrome";v="${fakeChromeVersion}", "Chromium";v="${fakeChromeVersion}"`,
    'DNT': `1`,
    'x-twitter-client-language': `en`,
    'sec-ch-ua-mobile': `?0`,
    'content-type': `application/x-www-form-urlencoded`,
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${fakeChromeVersion}.0.0.0 Safari/537.36`,
    'x-twitter-active-user': `yes`,
    'sec-ch-ua-platform': `"Windows"`,
    'Accept': `*/*`,
    'Origin': `https://twitter.com`,
    'Sec-Fetch-Site': `same-site`,
    'Sec-Fetch-Mode': `cors`,
    'Sec-Fetch-Dest': `empty`,
    'Referer': `https://twitter.com/`,
    'Accept-Encoding': `gzip, deflate, br`,
    'Accept-Language': `en`,
  },
  RESPONSE_HEADERS: {
    'content-type': 'text/html;charset=UTF-8',
    "x-powered-by": 'Black Magic',
    // 'cache-control': 'max-age=1'
  },
  DEFAULT_COLOR: '#10A3FF'
};

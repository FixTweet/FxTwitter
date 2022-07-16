const fakeChromeVersion = '103';

export const Constants = {
  BRANDING_NAME: BRANDING_NAME,
  DIRECT_MEDIA_DOMAINS: DIRECT_MEDIA_DOMAINS.split(','),
  HOST_URL: HOST_URL,
  REDIRECT_URL: REDIRECT_URL,
  TWITTER_ROOT: 'https://twitter.com',
  TWITTER_API_ROOT: 'https://api.twitter.com',
  /* We used to use Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA
  but accounts marked as 18+ wouldn't show up then */
  GUEST_BEARER_TOKEN: `Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw`,
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
    'simple_quoted_tweet=true'
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
    'Accept-Language': `en`
  },
  RESPONSE_HEADERS: {
    'allow': 'OPTIONS, GET, PURGE, HEAD',
    'content-type': 'text/html;charset=UTF-8',
    'x-powered-by': '🏳️‍⚧️ Trans Rights',
    'cache-control': 'max-age=604800'
  },
  DEFAULT_COLOR: '#10A3FF',
  ROBOTS_TXT: `User-agent: *
Allow: /$
Allow: /*/status
Allow: /*/status/
Allow: /owoembed
Allow: /owoembed/
Allow: /watch?v=dQw4w9WgXcQ
Disallow: /doing-harm-to-others
Disallow: /taking-over-the-world`
};

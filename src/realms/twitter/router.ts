import { Context, Hono } from 'hono';
// import { cache } from "hono/cache";
import { versionRoute } from '../common/version';
import { Strings } from '../../strings';
import { Constants } from '../../constants';
import { genericTwitterRedirect, setRedirectRequest } from './routes/redirects';
import { profileRequest } from './routes/profile';
import { statusRequest } from './routes/status';
import { oembed } from './routes/oembed';

export const twitter = new Hono();

export const getBaseRedirectUrl = (c: Context) => {
  const baseRedirect = c.req.header('cookie')?.match(/(?<=base_redirect=)(.*?)(?=;|$)/)?.[0];

  if (baseRedirect) {
    console.log('Found base redirect', baseRedirect);
    try {
      new URL(baseRedirect);
    } catch (e) {
      return Constants.TWITTER_ROOT;
    }
    return baseRedirect.endsWith('/') ? baseRedirect.slice(0, -1) : baseRedirect;
  }

  return Constants.TWITTER_ROOT;
};

/* Workaround for some dumb maybe-build time issue where statusRequest isn't ready or something because none of these trigger*/
const tweetRequest = async (c: Context) => await statusRequest(c);
const _profileRequest = async (c: Context) => await profileRequest(c);
/* How can hono not handle trailing slashes? This is so stupid,

serious TODO: Figure out how to make this not stupid. */
twitter.get('/:endpoint{status(es)?}/:id', tweetRequest);
twitter.get('/:endpoint{status(es)?}/:id/', tweetRequest);
twitter.get('/:endpoint{status(es)?}/:id/:language/', tweetRequest);
twitter.get('/:endpoint{status(es)?}/:id/:language', tweetRequest);
twitter.get(
  '/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:language',
  tweetRequest
);
twitter.get(
  '/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:language/',
  tweetRequest
);
twitter.get('/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id', tweetRequest);
twitter.get('/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/', tweetRequest);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:language',
  tweetRequest
);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:language/',
  tweetRequest
);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id',
  tweetRequest
);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/',
  tweetRequest
);
twitter.get(
  '/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}',
  tweetRequest
);
twitter.get(
  '/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/',
  tweetRequest
);
twitter.get(
  '/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/:language',
  tweetRequest
);
twitter.get(
  '/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/:language/',
  tweetRequest
);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}',
  tweetRequest
);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/',
  tweetRequest
);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/:language',
  tweetRequest
);
twitter.get(
  '/:prefix{(dir|dl)}/:handle{[0-9a-zA-Z_]+}/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/:language/',
  tweetRequest
);

twitter.get('/version/', versionRoute);
twitter.get('/version', versionRoute);
twitter.get('/set_base_redirect', setRedirectRequest);
twitter.get('/owoembed', oembed);

twitter.get('/robots.txt', async c => c.text(Strings.ROBOTS_TXT));

twitter.get('/i/events/:id', genericTwitterRedirect);
twitter.get('/hashtag/:hashtag', genericTwitterRedirect);

twitter.get('/:handle/', _profileRequest);
twitter.get('/:handle', _profileRequest);

twitter.all('*', async c => c.redirect(Constants.REDIRECT_URL, 302));

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

twitter.get('/status/:id', statusRequest);
// twitter.get('/:handle/status/:id', statusRequest);
// twitter.get('/:prefix/:handle/status/:id/:language?', statusRequest);
// twitter.get(
//   '/:prefix/:handle/status/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/:language?',
//   statusRequest
// );
// twitter.get('/:handle?/:endpoint{status(es)?}/:id/:language?', statusRequest);
// twitter.get(
//   '/:handle?/:endpoint{status(es)?}/:id/:mediaType{(photos?|videos?)}/:mediaNumber{[1-4]}/:language?',
//   statusRequest
// );

twitter.get('/version', versionRoute);
twitter.get('/set_base_redirect', setRedirectRequest);
twitter.get('/oembed', oembed);

twitter.get(
  '/robots.txt',
  async (c) => {
    c.header('cache-control', 'max-age=0, no-cache, no-store, must-revalidate');
    c.status(200);
    return c.text(Strings.ROBOTS_TXT);
  }
);

twitter.get('/i/events/:id', genericTwitterRedirect);
twitter.get('/hashtag/:hashtag', genericTwitterRedirect);

twitter.get('/:handle', profileRequest);

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

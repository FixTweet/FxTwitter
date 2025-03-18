import { Hono } from 'hono';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { bskyStatusRequest } from './routes/status';
import { oembed } from './routes/oembed';
import { Constants } from '../../constants';
import { versionRoute } from '../common/version';
import { DataProvider } from '../../enum';
import { genericBlueskyRedirect } from './routes/redirects';
import { activityRequest } from './routes/activity';
import { getBranding } from '../../helpers/branding';

export const bsky = new Hono();

bsky.use(trimTrailingSlash());
bsky.get('/owoembed', oembed);
bsky.get('/api/v1/statuses/:snowcode', activityRequest);
bsky.get('/:prefix/:handle/post/:id', bskyStatusRequest);
bsky.get('/profile/:handle/post/:id', bskyStatusRequest);
bsky.get('/:prefix/profile/:handle/post/:id/:language', bskyStatusRequest);
bsky.get('/profile/:handle/post/:id/:language', bskyStatusRequest);
bsky.get('/profile/*', genericBlueskyRedirect);
bsky.get('/version', c => versionRoute(c));

bsky.all('*', async c => c.redirect(getBranding(c).redirect, 302));

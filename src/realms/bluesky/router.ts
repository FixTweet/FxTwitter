import { Hono } from 'hono';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { bskyStatusRequest } from './routes/status';
import { oembed } from './routes/oembed';
import { Constants } from '../../constants';
import { versionRoute } from '../common/version';
import { DataProvider } from '../../enum';

export const bsky = new Hono();

bsky.use(trimTrailingSlash());
bsky.get('/owoembed', oembed);
bsky.get('/:prefix/:handle/post/:id', bskyStatusRequest);
bsky.get('/profile/:handle/post/:id', bskyStatusRequest);
bsky.get('/version', c => versionRoute(c, DataProvider.Bsky));

bsky.all('*', async c => c.redirect(Constants.REDIRECT_URL_BSKY, 302));
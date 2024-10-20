import { Hono } from 'hono';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { bskyStatusRequest } from './routes/status';

export const bsky = new Hono();

bsky.use(trimTrailingSlash());
bsky.get('/asd', c => c.text('asd'));
bsky.get('/profile/:handle/post/:id', bskyStatusRequest);

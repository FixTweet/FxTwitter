import { Context } from 'hono';
import { Constants } from '../../../constants';

export const genericBlueskyRedirect = async (c: Context) => {
  const url = new URL(c.req.url);
  return c.redirect(`${Constants.BSKY_ROOT}${url.pathname}`, 302);
};

import { Context } from "hono";

export const linkHitRequest = async (c: Context) => {
  // eslint-disable-next-line sonarjs/no-duplicate-string
  const userAgent = c.req.header('User-Agent') || '';

  if (userAgent.includes('Telegram')) {
    c.status(403);
  }
  // If param `url` exists, 302 redirect to it
  if (typeof c.req.query('url') === 'string') {
    const url = new URL(c.req.query('url') as string);
    return c.redirect(url.href, 302);
  }
}
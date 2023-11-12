import { MiddlewareHandler } from 'hono';
import { Constants } from './constants';
import {} from 'hono';

/* Wrapper to handle caching, and misc things like catching robots.txt */
export const cacheMiddleware = (): MiddlewareHandler => async (c, next) => {
  const request = c.req;
  const userAgent = request.header('User-Agent') ?? '';
  // https://developers.cloudflare.com/workers/examples/cache-api/
  let cacheUrl = new URL(request.url);

  if (userAgent.includes('Telegram')) {
    cacheUrl = new URL(`${request.url}&telegram`);
  } else if (userAgent.includes('Discord')) {
    cacheUrl = new URL(`${request.url}&discord`);
  } else if (userAgent.match(Constants.BOT_UA_REGEX)) {
    cacheUrl = new URL(`${request.url}&bot`);
  }

  console.log('cacheUrl', cacheUrl);

  let cacheKey: Request;

  try {
    cacheKey = new Request(cacheUrl.toString(), request);
  } catch (e) {
    /* In Miniflare, you can't really create requests like this, so we ignore caching in the test environment */
    await next();
    return c.res.clone();
  }

  const cache = caches.default;

  switch (request.method) {
    case 'GET':
      if (
        !Constants.API_HOST_LIST.includes(cacheUrl.hostname) &&
        !request.header('Cookie')?.includes('base_redirect')
      ) {
        /* cache may be undefined in tests */
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          console.log('Cache hit');
          return new Response(cachedResponse.body, cachedResponse);
        }

        console.log('Cache miss');
      }

      await next();

      // eslint-disable-next-line no-case-declarations
      const response = c.res.clone();

      /* Store the fetched response as cacheKey
         Use waitUntil so you can return the response without blocking on
         writing to cache */
      try {
        c.executionCtx && c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (error) {
        console.error((error as Error).stack);
      }

      return response;
    /* Telegram sends this from Webpage Bot, and Cloudflare sends it if we purge cache, and we respect it.
       PURGE is not defined in an RFC, but other servers like Nginx apparently use it. 
       
       Update 2023-11-09:
       
       For some reason, even before migrating to Hono, this returns 403 Forbidden now when PURGEd.
       I'm not sure why, as this is clearly not what we are doing. Is Cloudflare doing this? Is something else wrong? We'll also accept DELETE to do the same I guess. */
    case 'PURGE':
    case 'DELETE':
      console.log('Purging cache as requested');
      await cache.delete(cacheKey);
      return c.text('');
    /* yes, we do give HEAD */
    case 'HEAD':
      return c.text('');
    /* We properly state our OPTIONS when asked */
    case 'OPTIONS':
      c.header('allow', Constants.RESPONSE_HEADERS.allow);
      c.status(204);
      return c.text('');
    default:
      c.status(405);
      return c.text('');
  }
};

import { Env, Hono } from 'hono';
import { timing } from 'hono/timing';
import { logger } from 'hono/logger';
import { RewriteFrames } from '@sentry/integrations';
import { sentry } from '@hono/sentry';
import { Strings } from './strings';
import { Constants } from './constants';
import { api } from './realms/api/router';
import { twitter } from './realms/twitter/router';
import { cacheMiddleware } from './caches';

const noCache = 'max-age=0, no-cache, no-store, must-revalidate';

export const app = new Hono<{
  Bindings: { TwitterProxy: Fetcher; AnalyticsEngine: AnalyticsEngineDataset };
}>({
  getPath: req => {
    let url: URL;

    try {
      url = new URL(req.url);
    } catch (err) {
      return '/error';
    }
    const baseHostName = url.hostname.split('.').slice(-2).join('.');
    let realm = 'twitter';
    /* Override if in API_HOST_LIST. Note that we have to check full hostname for this. */
    if (Constants.API_HOST_LIST.includes(url.hostname)) {
      realm = 'api';
      console.log('API realm');
    } else if (Constants.STANDARD_DOMAIN_LIST.includes(baseHostName)) {
      console.log();
      realm = 'twitter';
      console.log('Twitter realm');
    } else {
      console.log(`Domain not assigned to realm, falling back to Twitter: ${url.hostname}`);
    }
    /* Defaults to Twitter realm if unknown domain specified (such as the *.workers.dev hostname or deprecated domain) */

    console.log(`/${realm}${url.pathname}`);
    return `/${realm}${url.pathname}`;
  }
});

app.use(
  '*',
  sentry({
    dsn: SENTRY_DSN,
    requestDataOptions: {
      allowedHeaders: /(.*)/,
      allowedSearchParams: /(.*)/
    },

    // integrations: [new RewriteFrames({ root: '/' }) as any],
    release: RELEASE_NAME
  })
);

app.use('*', async (c, next) => {
  /* Apply all headers from Constants.RESPONSE_HEADERS */
  for (const [header, value] of Object.entries(Constants.RESPONSE_HEADERS)) {
    c.header(header, value);
  }
  await next();
});

app.onError((err, c) => {
  c.get('sentry').captureException(err);
  console.error(err.stack);
  c.status(200);
  c.header('cache-control', noCache);

  return c.html(Strings.ERROR_HTML);
});

const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest);
};

app.use('*', logger(customLogger));

app.use('*', async (c, next) => {
  if (c.req.raw.cf) {
    console.log(`Hello from ⛅ ${c.req.raw.cf.colo ?? 'UNK'}`);
  }
  console.log('userAgent', c.req.header('user-agent'));
  await next();
});

app.use('*', cacheMiddleware());
app.use('*', timing({ enabled: false }));

app.route(`/api`, api);
app.route(`/twitter`, twitter);

app.all('/error', async c => {
  c.header('cache-control', noCache);
  c.status(400);
  return c.body('');
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      return await app.fetch(request, env, ctx);
    } catch (err) {
      console.error(err);
      console.log('Ouch, that error hurt so much Sentry couldnt catch it');

      return new Response(Strings.ERROR_HTML, {
        headers: {
          ...Constants.RESPONSE_HEADERS,
          'content-type': 'text/html;charset=utf-8',
          'cache-control': noCache
        },
        status: 200
      });
    }
  }
};
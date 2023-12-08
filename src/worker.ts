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

/* This is the root app which contains route trees for multiple "realms".

   We use the term "realms" rather than domains because of the way FixTweet is structured.
   fxtwitter.com and fixupx.com both contain the exact same content, but api.fxtwitter.com does not*, despite technically
   being the same domain as fxtwitter.com. Similarly, d.fxtwitter.com and other subdomain flags, etc. 
   This allows us to connect a single FixTweet worker to tons of domains and still route them to the correct content.
   This will prove useful if/when we add other data providers to FixTweet.

   * Under the old system with itty-router, this was not the case, but it is since adopting Hono. This will be necessary for FixTweet API v2. */
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

if (SENTRY_DSN) {
  app.use(
    '*',
    sentry({
      dsn: SENTRY_DSN,
      requestDataOptions: {
        allowedHeaders: /(.*)/,
        allowedSearchParams: /(.*)/
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      integrations: [new RewriteFrames({ root: '/' }) as any],
      release: RELEASE_NAME
    })
  );
}

app.use('*', async (c, next) => {
  /* Apply all headers from Constants.RESPONSE_HEADERS */
  for (const [header, value] of Object.entries(Constants.RESPONSE_HEADERS)) {
    c.header(header, value);
  }
  await next();
});

app.onError((err, c) => {
  c.get('sentry')?.captureException?.(err);
  console.error(err.stack);
  let errorCode = 500;
  if (err.name === 'AbortError') {
    errorCode = 504;
  }
  /* We return it as a 200 so embedded applications can display the error */
  if (
    c.req
      .header('User-Agent')
      ?.match(/(discordbot|telegrambot|facebook|whatsapp|firefox\/92|vkshare)/gi)
  ) {
    errorCode = 200;
  }
  c.status(errorCode);
  c.header('cache-control', noCache);

  return c.html(Strings.ERROR_HTML);
});

const customLogger = (message: string, ...rest: string[]) => {
  console.log(message, ...rest);
};

app.use('*', logger(customLogger));

app.use('*', async (c, next) => {
  if (c.req.raw.cf) {
    const cf = c.req.raw.cf;
    console.log(`Hello from ⛅ ${cf.colo ?? 'UNK'}`);
    console.log(
      `📶 ${cf.httpProtocol ?? 'Unknown HTTP Protocol'} 🏓 ${cf.clientTcpRtt ?? 'N/A'} ms RTT 🔒 ${
        cf.tlsVersion ?? 'Unencrypted Connection'
      } (${cf.tlsCipher ?? ''})`
    );
    console.log(
      `🗺️  ${cf.city ?? 'Unknown City'}, ${cf.regionCode ? cf.regionCode + ', ' : ''}${
        cf.country ?? 'Unknown Country'
      } ${cf.isEUCountry ? '(EU)' : ''}`
    );
    console.log(
      `🌐 ${c.req.header('x-real-ip') ?? ''} (${cf.asn ? 'AS' + cf.asn : 'Unknown ASN'}, ${
        cf.asOrganization ?? 'Unknown Organization'
      })`
    );
  } else {
    console.log(`🌐 ${c.req.header('x-real-ip') ?? ''}`);
  }
  console.log('🕵️‍♂️', c.req.header('user-agent'));
  console.log('------------------');
  await next();
});

app.use('*', cacheMiddleware());
app.use('*', timing({ enabled: false }));

app.route(`/api`, api);
app.route(`/twitter`, twitter);

app.all('/error', async c => {
  c.header('cache-control', noCache);

  if (
    c.req
      .header('User-Agent')
      ?.match(/(discordbot|telegrambot|facebook|whatsapp|firefox\/92|vkshare)/gi)
  ) {
    c.status(200);
    return c.html(Strings.ERROR_HTML);
  }
  c.status(400);
  /* We return it as a 200 so embedded applications can display the error */
  return c.body('');
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      return await app.fetch(request, env, ctx);
    } catch (err) {
      console.error(err);
      const e = err as Error;
      console.log(`Ouch, that error hurt so much Sentry couldn't catch it`);
      console.log(e.stack);
      let errorCode = 500;
      if (e.name === 'AbortError') {
        errorCode = 504;
      }
      /* We return it as a 200 so embedded applications can display the error */
      if (
        request.headers
          .get('user-agent')
          ?.match(/(discordbot|telegrambot|facebook|whatsapp|firefox\/92|vkshare)/gi)
      ) {
        errorCode = 200;
      }

      return new Response(
        e.name === 'AbortError' ? Strings.TIMEOUT_ERROR_HTML : Strings.ERROR_HTML,
        {
          headers: {
            ...Constants.RESPONSE_HEADERS,
            'content-type': 'text/html;charset=utf-8',
            'cache-control': noCache
          },
          status: errorCode
        }
      );
    }
  }
};

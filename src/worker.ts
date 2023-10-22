/* eslint-disable no-case-declarations */
import { Toucan } from 'toucan-js';
import { RewriteFrames } from '@sentry/integrations';

import { IRequest, Router } from 'itty-router';
import { Constants } from './constants';
import { handleStatus } from './embed/status';
import { Strings } from './strings';

import motd from '../motd.json';
import { sanitizeText } from './helpers/utils';
import { handleProfile } from './user';
import { threadAPIProvider } from './providers/twitter/status';

declare const globalThis: {
  fetchCompletedTime: number;
};

const router = Router();

const getBaseRedirectUrl = (request: IRequest) => {
  const baseRedirect = request.headers
    ?.get('cookie')
    ?.match(/(?<=base_redirect=)(.*?)(?=;|$)/)?.[0];

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

/* Handler for status (Tweet) request */
const statusRequest = async (request: IRequest, event: FetchEvent, flags: InputFlags = {}) => {
  const { handle, id, mediaNumber, language, prefix } = request.params;
  const url = new URL(request.url);
  // eslint-disable-next-line sonarjs/no-duplicate-string
  const userAgent = request.headers.get('User-Agent') || '';

  /* Let's return our HTML version for wayback machine (we can add other archivers too in future) */
  if (
    ['archive.org', 'Wayback Machine'].some(
      service => request.headers.get('Via')?.includes?.(service)
    )
  ) {
    console.log('Request from archive.org');
    flags.archive = true;
  }

  /* User Agent matching for embed generators, bots, crawlers, and other automated
     tools. It's pretty all-encompassing. Note that Firefox/92 is in here because 
     Discord sometimes uses the following UA:
     
     Mozilla/5.0 (Macintosh; Intel Mac OS X 11.6; rv:92.0) Gecko/20100101 Firefox/92.0
     
     I'm not sure why that specific one, it's pretty weird, but this edge case ensures
     stuff keeps working.
     
     On the very rare off chance someone happens to be using specifically Firefox 92,
     the http-equiv="refresh" meta tag will ensure an actual human is sent to the destination. */
  const isBotUA = userAgent.match(Constants.BOT_UA_REGEX) !== null || flags?.archive;

  /* Check if domain is a direct media domain (i.e. d.fxtwitter.com),
     the tweet is prefixed with /dl/ or /dir/ (for TwitFix interop), or the
     tweet ends in .mp4, .jpg, .jpeg, or .png
      
     Note that .png is not documented because images always redirect to a jpg,
     but it will help someone who does it mistakenly on something like Discord
      
     Also note that all we're doing here is setting the direct flag. If someone
     links a video and ends it with .jpg, it will still redirect to a .mp4! */
  if (url.pathname.match(/\/status(es)?\/\d{2,20}\.(mp4|png|jpe?g)/g)) {
    console.log('Direct media request by extension');
    flags.direct = true;
  } else if (Constants.DIRECT_MEDIA_DOMAINS.includes(url.hostname)) {
    console.log('Direct media request by domain');
    flags.direct = true;
  } else if (Constants.TEXT_ONLY_DOMAINS.includes(url.hostname)) {
    console.log('Text-only embed request');
    flags.textOnly = true;
  } else if (Constants.INSTANT_VIEW_DOMAINS.includes(url.hostname)) {
    console.log('Forced instant view request');
    flags.forceInstantView = true;
  } else if (prefix === 'dl' || prefix === 'dir') {
    console.log('Direct media request by path prefix');
    flags.direct = true;
  }

  /* The pxtwitter.com domain is deprecated and Tweets posted after deprecation
     date will have a notice saying we've moved to fxtwitter.com! */
  if (
    Constants.DEPRECATED_DOMAIN_LIST.includes(url.hostname) &&
    BigInt(id?.match(/\d{2,20}/g)?.[0] || 0) > Constants.DEPRECATED_DOMAIN_EPOCH
  ) {
    console.log('Request to deprecated domain');
    flags.deprecated = true;
  }

  /* TODO: Figure out what we're doing with FixTweet / FixupX branding in future */
  if (/fixup/g.test(url.href)) {
    console.log(`We're using x domain`);
    flags.isXDomain = true;
  } else {
    console.log(`We're using twitter domain`);
  }

  const baseUrl = getBaseRedirectUrl(request);

  /* Check if request is to api.fxtwitter.com, or the tweet is appended with .json
     Note that unlike TwitFix, FixTweet will never generate embeds for .json, and
     in fact we only support .json because it's what people using TwitFix API would
     be used to. */
  if (
    url.pathname.match(/\/status(es)?\/\d{2,20}\.(json)/g) !== null ||
    Constants.API_HOST_LIST.includes(url.hostname)
  ) {
    console.log('JSON API request');
    flags.api = true;
  }

  /* Direct media or API access bypasses bot check, returning same response regardless of UA */
  if (isBotUA || flags.direct || flags.api) {
    if (isBotUA) {
      console.log(`Matched bot UA ${userAgent}`);
    } else {
      console.log('Bypass bot check');
    }

    /* This throws the necessary data to handleStatus (in status.ts) */
    const statusResponse = await handleStatus(
      id?.match(/\d{2,20}/)?.[0] || '0',
      mediaNumber ? parseInt(mediaNumber) : undefined,
      userAgent,
      flags,
      language,
      event
    );

    /* Complete responses are normally sent just by errors. Normal embeds send a `text` value. */
    if (statusResponse.response) {
      console.log('handleStatus sent response');
      return statusResponse.response;
    } else if (statusResponse.text) {
      console.log('handleStatus sent embed');
      /* We're checking if the User Agent is a bot again specifically in case they requested
         direct media (d.fxtwitter.com, .mp4/.jpg, etc) but the Tweet contains no media.

         Since we obviously have no media to give the user, we'll just redirect to the Tweet.
         Embeds will return as usual to bots as if direct media was never specified. */
      if (!isBotUA && !flags.api) {
        const baseUrl = getBaseRedirectUrl(request);
        /* Do not cache if using a custom redirect */
        const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

        return new Response(null, {
          status: 302,
          headers: {
            Location: `${baseUrl}/${handle || 'i'}/status/${id}`,
            ...(cacheControl ? { 'cache-control': cacheControl } : {})
          }
        });
      }

      let headers = Constants.RESPONSE_HEADERS;

      if (statusResponse.cacheControl) {
        headers = {
          ...headers,
          'cache-control':
            baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : statusResponse.cacheControl
        };
      }

      /* Return the response containing embed information */
      return new Response(statusResponse.text, {
        headers: headers,
        status: 200
      });
    } else {
      /* Somehow handleStatus sent us nothing. This should *never* happen, but we have a case for it. */
      return new Response(Strings.ERROR_UNKNOWN, {
        headers: Constants.RESPONSE_HEADERS,
        status: 500
      });
    }
  } else {
    globalThis.fetchCompletedTime = performance.now();
    /* A human has clicked a fxtwitter.com/:screen_name/status/:id link!
       Obviously we just need to redirect to the Tweet directly.*/
    console.log('Matched human UA', userAgent);

    const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}/${handle || 'i'}/status/${id?.match(/\d{2,20}/)?.[0]}`,
        ...(cacheControl ? { 'cache-control': cacheControl } : {})
      }
    });
  }
};

/* Handler for User Profiles */
const profileRequest = async (request: IRequest, event: FetchEvent, flags: InputFlags = {}) => {
  const { handle } = request.params;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';

  /* User Agent matching for embed generators, bots, crawlers, and other automated
     tools. It's pretty all-encompassing. Note that Firefox/92 is in here because 
     Discord sometimes uses the following UA:
     
     Mozilla/5.0 (Macintosh; Intel Mac OS X 11.6; rv:92.0) Gecko/20100101 Firefox/92.0
     
     I'm not sure why that specific one, it's pretty weird, but this edge case ensures
     stuff keeps working.
     
     On the very rare off chance someone happens to be using specifically Firefox 92,
     the http-equiv="refresh" meta tag will ensure an actual human is sent to the destination. */
  const isBotUA = userAgent.match(Constants.BOT_UA_REGEX) !== null;

  /* If not a valid screen name, we redirect to project GitHub */
  if (handle.match(/\w{1,15}/gi)?.[0] !== handle) {
    return Response.redirect(Constants.REDIRECT_URL, 302);
  }
  const username = handle.match(/\w{1,15}/gi)?.[0] as string;
  /* Check if request is to api.fxtwitter.com */
  if (Constants.API_HOST_LIST.includes(url.hostname)) {
    console.log('JSON API request');
    flags.api = true;
  }

  /* Direct media or API access bypasses bot check, returning same response regardless of UA */
  if (isBotUA || flags.api) {
    if (isBotUA) {
      console.log(`Matched bot UA ${userAgent}`);
    } else {
      console.log('Bypass bot check');
    }

    /* This throws the necessary data to handleStatus (in status.ts) */
    const profileResponse = await handleProfile(username, userAgent, flags, event);

    /* Complete responses are normally sent just by errors. Normal embeds send a `text` value. */
    if (profileResponse.response) {
      console.log('handleProfile sent response');
      return profileResponse.response;
    } else if (profileResponse.text) {
      console.log('handleProfile sent embed');
      /* TODO This check has purpose in the original handleStatus handler, but I'm not sure if this edge case can happen here */
      const baseUrl = getBaseRedirectUrl(request);
      /* Check for custom redirect */

      if (!isBotUA) {
        /* Do not cache if using a custom redirect */
        const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

        return new Response(null, {
          status: 302,
          headers: {
            Location: `${baseUrl}/${handle}`,
            ...(cacheControl ? { 'cache-control': cacheControl } : {})
          }
        });
      }

      let headers = Constants.RESPONSE_HEADERS;

      if (profileResponse.cacheControl) {
        headers = {
          ...headers,
          'cache-control':
            baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : profileResponse.cacheControl
        };
      }

      /* Return the response containing embed information */
      return new Response(profileResponse.text, {
        headers: headers,
        status: 200
      });
    } else {
      /* Somehow handleStatus sent us nothing. This should *never* happen, but we have a case for it. */
      return new Response(Strings.ERROR_UNKNOWN, {
        headers: { ...Constants.RESPONSE_HEADERS, 'cache-control': 'max-age=0' },
        status: 500
      });
    }
  } else {
    /* A human has clicked a fxtwitter.com/:screen_name link!
        Obviously we just need to redirect to the user directly.*/
    console.log('Matched human UA', userAgent);

    const baseUrl = getBaseRedirectUrl(request);
    /* Do not cache if using a custom redirect */
    const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}/${handle}`,
        ...(cacheControl ? { 'cache-control': cacheControl } : {})
      }
    });
  }
};

const genericTwitterRedirect = async (request: IRequest) => {
  const url = new URL(request.url);
  const baseUrl = getBaseRedirectUrl(request);
  /* Do not cache if using a custom redirect */
  const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${baseUrl}${url.pathname}`,
      ...(cacheControl ? { 'cache-control': cacheControl } : {})
    }
  });
};

const versionRequest = async (request: IRequest) => {
  globalThis.fetchCompletedTime = performance.now();
  return new Response(
    Strings.VERSION_HTML.format({
      rtt: request.cf?.clientTcpRtt ? `🏓 ${request.cf.clientTcpRtt} ms RTT` : '',
      colo: (request.cf?.colo as string) ?? '??',
      httpversion: (request.cf?.httpProtocol as string) ?? 'Unknown HTTP Version',
      tlsversion: (request.cf?.tlsVersion as string) ?? 'Unknown TLS Version',
      ip:
        request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip') ?? 'Unknown IP',
      city: (request.cf?.city as string) ?? 'Unknown City',
      region: (request.cf?.region as string) ?? request.cf?.country ?? 'Unknown Region',
      country: (request.cf?.country as string) ?? 'Unknown Country',
      asn: `AS${request.cf?.asn ?? '??'} (${request.cf?.asOrganization ?? 'Unknown ASN'})`,
      ua: sanitizeText(request.headers.get('user-agent') ?? 'Unknown User Agent')
    }),
    {
      headers: {
        ...Constants.RESPONSE_HEADERS,
        'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
      },
      status: 200
    }
  );
};

const setRedirectRequest = async (request: IRequest) => {
  /* Query params */
  const { searchParams } = new URL(request.url);
  let url = searchParams.get('url');

  /* Check that origin either does not exist or is in our domain list */
  const origin = request.headers.get('origin');
  if (origin && !Constants.STANDARD_DOMAIN_LIST.includes(new URL(origin).hostname)) {
    return new Response(
      Strings.MESSAGE_HTML.format({
        message: `Failed to set base redirect: Your request seems to be originating from another domain, please open this up in a new tab if you are trying to set your base redirect.`
      }),
      {
        headers: Constants.RESPONSE_HEADERS,
        status: 403
      }
    );
  }

  if (!url) {
    /* Remove redirect URL */
    return new Response(
      Strings.MESSAGE_HTML.format({
        message: `Your base redirect has been cleared. To set one, please pass along the <code>url</code> parameter.`
      }),
      {
        headers: {
          'set-cookie': `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`,
          'content-security-policy': `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`,
          ...Constants.RESPONSE_HEADERS
        },
        status: 200
      }
    );
  }

  try {
    new URL(url);
  } catch (e) {
    try {
      new URL(`https://${url}`);
    } catch (e) {
      /* URL is not well-formed, remove */
      console.log('Invalid base redirect URL, removing cookie before redirect');

      return new Response(
        Strings.MESSAGE_HTML.format({
          message: `Your URL does not appear to be well-formed. Example: ?url=https://nitter.net`
        }),
        {
          headers: {
            'set-cookie': `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`,
            'content-security-policy': `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(
              ' '
            )};`,
            ...Constants.RESPONSE_HEADERS
          },
          status: 200
        }
      );
    }

    url = `https://${url}`;
  }

  /* Set cookie for url */
  return new Response(
    Strings.MESSAGE_HTML.format({
      message: `Successfully set base redirect, you will now be redirected to ${sanitizeText(
        url
      )} rather than ${Constants.TWITTER_ROOT}`
    }),
    {
      headers: {
        'set-cookie': `base_redirect=${url}; path=/; max-age=63072000; secure; HttpOnly`,
        'content-security-policy': `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`,
        ...Constants.RESPONSE_HEADERS
      },
      status: 200
    }
  );
};

/* TODO: is there any way to consolidate these stupid routes for itty-router?
   I couldn't find documentation allowing for regex matching */
router.get('/:prefix?/:handle/status/:id', statusRequest);
router.get('/:prefix?/:handle/status/:id/photo/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/status/:id/photos/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/status/:id/video/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/status/:id/videos/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/statuses/:id', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/photo/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/photos/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/video/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/videos/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/status/:id/:language', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/:language', statusRequest);
router.get('/status/:id', statusRequest);
router.get('/status/:id/:language', statusRequest);
router.get('/version', versionRequest);
router.get('/set_base_redirect', setRedirectRequest);
router.get('/v2/twitter/thread/:id', threadAPIProvider)

/* Oembeds (used by Discord to enhance responses) 

Yes, I actually made the endpoint /owoembed. Deal with it. */
router.get('/owoembed', async (request: IRequest) => {
  globalThis.fetchCompletedTime = performance.now();
  console.log('oembed hit!');
  const { searchParams } = new URL(request.url);

  /* Fallbacks */
  const text = searchParams.get('text') || 'Twitter';
  const author = searchParams.get('author') || 'jack';
  const status = searchParams.get('status') || '20';
  // const useXbranding = searchParams.get('useXbranding') === 'true';

  const random = Math.floor(Math.random() * Object.keys(motd).length);
  const [name, url] = Object.entries(motd)[random];

  const test = {
    author_name: text,
    author_url: `${Constants.TWITTER_ROOT}/${encodeURIComponent(author)}/status/${status}`,
    /* Change provider name if tweet is on deprecated domain. */
    provider_name:
      searchParams.get('deprecated') === 'true' ? Strings.DEPRECATED_DOMAIN_NOTICE_DISCORD : name,
    /*useXbranding ? name : Strings.X_DOMAIN_NOTICE*/
    provider_url: url,
    title: Strings.DEFAULT_AUTHOR_TEXT,
    type: 'link',
    version: '1.0'
  };
  /* Stringify and send it on its way! */
  return new Response(JSON.stringify(test), {
    headers: {
      ...Constants.RESPONSE_HEADERS,
      'content-type': 'application/json'
    },
    status: 200
  });
});

/* Pass through profile requests to Twitter.
   We don't currently have custom profile cards yet,
   but it's something we might do. Maybe. */
router.get('/:handle', profileRequest);
router.get('/:handle/', profileRequest);
router.get('/i/events/:id', genericTwitterRedirect);
router.get('/hashtag/:hashtag', genericTwitterRedirect);

/* If we don't understand the route structure at all, we'll
   redirect to GitHub (normal domains) or API docs (api.fxtwitter.com) */
router.get('*', async (request: IRequest) => {
  const url = new URL(request.url);

  if (Constants.API_HOST_LIST.includes(url.hostname)) {
    return Response.redirect(Constants.API_DOCS_URL, 302);
  }
  return Response.redirect(Constants.REDIRECT_URL, 302);
});

/* Wrapper to handle caching, and misc things like catching robots.txt */
export const cacheWrapper = async (request: Request, event?: FetchEvent): Promise<Response> => {
  const startTime = performance.now();
  const userAgent = request.headers.get('User-Agent') || '';
  // https://developers.cloudflare.com/workers/examples/cache-api/
  const cacheUrl = new URL(
    userAgent.includes('Telegram')
      ? `${request.url}&telegram`
      : userAgent.includes('Discord')
      ? `${request.url}&discord`
      : request.url
  );

  console.log(`Hello from ⛅ ${request.cf?.colo || 'UNK'}`);
  console.log('userAgent', userAgent);
  console.log('cacheUrl', cacheUrl);

  const cacheKey = new Request(cacheUrl.toString(), request);
  const cache = caches.default;

  /* Itty-router doesn't seem to like routing file names because whatever,
     so we just handle it in the caching layer instead. Kinda hacky, but whatever. */
  if (cacheUrl.pathname === '/robots.txt') {
    return new Response(Strings.ROBOTS_TXT, {
      headers: {
        ...Constants.RESPONSE_HEADERS,
        'content-type': 'text/plain'
      },
      status: 200
    });
  }

  /* Some TwitFix APIs will never be available in FixTweet for privacy or
     design choice reasons. 
     
     Trying to access these APIs result in a message saying TwitFix API
     has been sunset. */
  if (
    cacheUrl.pathname.startsWith('/api/') ||
    cacheUrl.pathname.startsWith('/other/') ||
    cacheUrl.pathname.startsWith('/info/')
  ) {
    return new Response(Strings.TWITFIX_API_SUNSET, {
      headers: Constants.RESPONSE_HEADERS,
      status: 410
    });
  }

  switch (request.method) {
    case 'GET':
      if (
        !Constants.API_HOST_LIST.includes(cacheUrl.hostname) &&
        !request.headers?.get('Cookie')?.includes('base_redirect')
      ) {
        /* cache may be undefined in tests */
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          console.log('Cache hit');
          return cachedResponse;
        }

        console.log('Cache miss');
      }

      const response = await router.handle(request, event);

      /* Store the fetched response as cacheKey
         Use waitUntil so you can return the response without blocking on
         writing to cache */
      try {
        event && event.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (error) {
        console.error((error as Error).stack);
      }

      const endTime = performance.now();
      const timeSinceFetch = endTime - (globalThis.fetchCompletedTime || 0);
      const timeSinceStart = endTime - startTime;
      console.log(
        `Request took ${timeSinceStart}ms, of which ${timeSinceFetch}ms was CPU time after last fetch`
      );

      return response;
    /* Telegram sends this from Webpage Bot, and Cloudflare sends it if we purge cache, and we respect it.
       PURGE is not defined in an RFC, but other servers like Nginx apparently use it. */
    case 'PURGE':
      console.log('Purging cache as requested');
      await cache.delete(cacheKey);
      return new Response('', { status: 200 });
    /* yes, we do give HEAD */
    case 'HEAD':
      return new Response('', {
        headers: Constants.RESPONSE_HEADERS,
        status: 200
      });
    /* We properly state our OPTIONS when asked */
    case 'OPTIONS':
      return new Response('', {
        headers: {
          allow: Constants.RESPONSE_HEADERS.allow
        },
        status: 204
      });
    default:
      return new Response('', { status: 405 });
  }
};

/* Wrapper around Sentry, used for catching uncaught exceptions */
const sentryWrapper = async (event: FetchEvent, test = false): Promise<void> => {
  let sentry: null | Toucan = null;

  if (typeof SENTRY_DSN !== 'undefined' && SENTRY_DSN && !test) {
    /* We use Toucan for Sentry. Toucan is a Sentry SDK designed for Cloudflare Workers / DOs */
    sentry = new Toucan({
      dsn: SENTRY_DSN,
      context: event,
      request: event.request,
      requestDataOptions: {
        allowedHeaders: /(.*)/,
        allowedSearchParams: /(.*)/
      },

      /* TODO: Figure out what changed between @sentry/integration 7.65.0 and 7.66.0
         https://github.com/getsentry/sentry-javascript/compare/7.65.0...7.66.0 
         which caused types to go apeshit */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      integrations: [new RewriteFrames({ root: '/' }) as any],
      /* event includes 'waitUntil', which is essential for Sentry logs to be delivered.
         Also includes 'request' -- no need to set it separately. */
      release: RELEASE_NAME
    });
  }

  /* Responds with either a returned response (good!!!) or returns
     a crash response (bad!!!) */
  event.respondWith(
    (async (): Promise<Response> => {
      try {
        return await cacheWrapper(event.request, event);
      } catch (err: unknown) {
        sentry && sentry.captureException(err);

        /* workaround for silly TypeScript things */
        const error = err as Error;
        console.error(error.stack);

        return new Response(Strings.ERROR_HTML, {
          headers: {
            ...Constants.RESPONSE_HEADERS,
            'content-type': 'text/html',
            'cache-control': 'max-age=0, no-cache, no-store, must-revalidate'
          },
          status: 200
        });
      }
    })()
  );
};

/* Event to receive web requests on Cloudflare Worker */
addEventListener('fetch', (event: FetchEvent) => {
  sentryWrapper(event);
});

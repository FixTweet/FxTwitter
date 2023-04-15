import Toucan from 'toucan-js';

import { IRequest, Router } from 'itty-router';
import { Constants } from './constants';
import { handleStatus } from './status';
import { Strings } from './strings';

import motd from '../motd.json';
import { sanitizeText } from './helpers/utils';
import { handleProfile } from './user';

const router = Router();

/* Handler for status (Tweet) request */
const statusRequest = async (
  request: IRequest,
  event: FetchEvent,
  flags: InputFlags = {}
) => {
  const { handle, id, mediaNumber, language, prefix } = request.params;
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
      if (!isBotUA) {
        return Response.redirect(`${Constants.TWITTER_ROOT}/${handle}/status/${id}`, 302);
      }

      let headers = Constants.RESPONSE_HEADERS;

      if (statusResponse.cacheControl) {
        headers = { ...headers, 'cache-control': statusResponse.cacheControl };
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
    /* A human has clicked a fxtwitter.com/:screen_name/status/:id link!
       Obviously we just need to redirect to the Tweet directly.*/
    console.log('Matched human UA', userAgent);
    return Response.redirect(
      `${Constants.TWITTER_ROOT}/${handle}/status/${id?.match(/\d{2,20}/)?.[0]}`,
      302
    );
  }
};

/* Handler for User Profiles */
const profileRequest = async (request: IRequest, event: FetchEvent,
  flags: InputFlags = {}) => {
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
    const profileResponse = await handleProfile(
      username,
      userAgent,
      flags,
      event
    );

    /* Complete responses are normally sent just by errors. Normal embeds send a `text` value. */
    if (profileResponse.response) {
      console.log('handleProfile sent response');
      return profileResponse.response;
    } else if (profileResponse.text) {
      console.log('handleProfile sent embed');
      /* TODO This check has purpose in the original handleStatus handler, but I'm not sure if this edge case can happen here */
      if (!isBotUA) {
        return Response.redirect(`${Constants.TWITTER_ROOT}/${handle}`, 302);
      }

      let headers = Constants.RESPONSE_HEADERS;

      if (profileResponse.cacheControl) {
        headers = { ...headers, 'cache-control': profileResponse.cacheControl };
      }

      /* Return the response containing embed information */
      return new Response(profileResponse.text, {
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
    /* A human has clicked a fxtwitter.com/:screen_name link!
        Obviously we just need to redirect to the user directly.*/
    console.log('Matched human UA', userAgent);
    return Response.redirect(
      `${Constants.TWITTER_ROOT}/${handle}`,
      302
    );
  }
};

const genericTwitterRedirect = async (request: IRequest) => {
  const url = new URL(request.url);
  return Response.redirect(`${Constants.TWITTER_ROOT}${url.pathname}`, 302);
};

const versionRequest = async (request: IRequest) => {
  return new Response(
    Strings.VERSION_HTML.format({
      rtt: request.cf?.clientTcpRtt ? `🏓 ${request.cf.clientTcpRtt} ms RTT` : '',
      colo: request.cf?.colo || '??',
      httpversion: request.cf?.httpProtocol || 'Unknown HTTP Version',
      tlsversion: request.cf?.tlsVersion || 'Unknown TLS Version',
      ip:
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'Unknown IP',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - @cloudflare/workers-types v4 is missing IncomingRequestCfProperties.city despite it being a real property
      city: request.cf?.city || 'Unknown City',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - @cloudflare/workers-types v4 is missing IncomingRequestCfProperties.country / region despite it being a real property
      region: request.cf?.region || request.cf?.country || 'Unknown Region',
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - @cloudflare/workers-types v4 is missing IncomingRequestCfProperties.country despite it being a real property
      country: request.cf?.country || 'Unknown Country',
      asn: `AS${request.cf?.asn || '??'} (${
        request.cf?.asOrganization || 'Unknown ASN'
      })`,
      ua: sanitizeText(request.headers.get('user-agent') || 'Unknown User Agent')
    }),
    {
      headers: {
        ...Constants.RESPONSE_HEADERS,
        'cache-control': 'max-age=1'
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
router.get('/:prefix?/:handle/statuses/:id', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/photo/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/photos/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/video/:mediaNumber', statusRequest);
router.get('/:prefix?/:handle/status/:id/:language', statusRequest);
router.get('/:prefix?/:handle/statuses/:id/:language', statusRequest);
router.get('/status/:id', statusRequest);
router.get('/status/:id/:language', statusRequest);
router.get('/version', versionRequest);

/* Oembeds (used by Discord to enhance responses) 

Yes, I actually made the endpoint /owoembed. Deal with it. */
router.get('/owoembed', async (request: IRequest) => {
  console.log('oembed hit!');
  const { searchParams } = new URL(request.url);

  /* Fallbacks */
  const text = searchParams.get('text') || 'Twitter';
  const author = searchParams.get('author') || 'dangeredwolf';
  const status = searchParams.get('status') || '1547514042146865153';

  const random = Math.floor(Math.random() * Object.keys(motd).length);
  const [name, url] = Object.entries(motd)[random];

  const test = {
    author_name: text,
    author_url: `${Constants.TWITTER_ROOT}/${encodeURIComponent(
      author
    )}/status/${status}`,
    /* Change provider name if tweet is on deprecated domain. */
    provider_name:
      searchParams.get('deprecated') === 'true'
        ? Strings.DEPRECATED_DOMAIN_NOTICE_DISCORD
        : name,
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
export const cacheWrapper = async (
  request: Request,
  event?: FetchEvent
): Promise<Response> => {
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
    return new Response(Constants.ROBOTS_TXT, {
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
      status: 404
    });
  }

  switch (request.method) {
    case 'GET':
      if (!Constants.API_HOST_LIST.includes(cacheUrl.hostname)) {
        /* cache may be undefined in tests */
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          console.log('Cache hit');
          return cachedResponse;
        }

        console.log('Cache miss');
      }

      /* Literally do not know what the hell eslint is complaining about */
      // eslint-disable-next-line no-case-declarations
      const response = await router.handle(request, event);

      /* Store the fetched response as cacheKey
         Use waitUntil so you can return the response without blocking on
         writing to cache */
      try {
        event && event.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (error) {
        console.error((error as Error).stack);
      }

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
      /* event includes 'waitUntil', which is essential for Sentry logs to be delivered.
         Also includes 'request' -- no need to set it separately. */
      allowedHeaders: /(.*)/,
      allowedSearchParams: /(.*)/,
      release: RELEASE_NAME,
      rewriteFrames: {
        root: '/'
      },
      event
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
            'cache-control': 'max-age=1'
          },
          status: 500
        });
      }
    })()
  );
};

/* Event to receive web requests on Cloudflare Worker */
addEventListener('fetch', (event: FetchEvent) => {
  sentryWrapper(event);
});

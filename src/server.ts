import { Router } from 'itty-router';
import { Constants } from './constants';
import { handleStatus } from './status';
import { Strings } from './strings';

const router = Router();

const statusRequest = async (request: any, event: FetchEvent) => {
  const { id, mediaNumber } = request.params;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent');

  if (userAgent.match(/bot/gi) !== null) {
    // https://developers.cloudflare.com/workers/examples/cache-api/
    const cacheUrl = new URL(request.url);
    const cacheKey = new Request(cacheUrl.toString(), request);
    const cache = caches.default;

    let response = await cache.match(cacheKey);

    if (response) {
      console.log('Cache hit');
      return response;
    }

    console.log('Cache miss');

    response = new Response(
      await handleStatus(id, parseInt(mediaNumber || 1), userAgent),
      {
        headers: Constants.RESPONSE_HEADERS,
        status: 200
      }
    );

    // Store the fetched response as cacheKey
    // Use waitUntil so you can return the response without blocking on
    // writing to cache
    event.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  } else {
    return Response.redirect(`${Constants.TWITTER_ROOT}${url.pathname}`, 302);
  }
};

const profileRequest = async (request: any, _event: FetchEvent) => {
  const { handle } = request.params;
  const url = new URL(request.url);

  if (handle.match(/[a-z0-9_]{1,15}/gi) !== handle) {
    return Response.redirect(Constants.REDIRECT_URL, 302);
  } else {
    return Response.redirect(`${Constants.TWITTER_ROOT}${url.pathname}`, 302);
  }
};

router.get('/:handle/status/:id', statusRequest);
router.get('/:handle/status/:id/photo/:mediaNumber', statusRequest);
router.get('/:handle/status/:id/video/:mediaNumber', statusRequest);
router.get('/:handle/statuses/:id', statusRequest);
router.get('/:handle/statuses/:id/photo/:mediaNumber', statusRequest);
router.get('/:handle/statuses/:id/video/:mediaNumber', statusRequest);

router.get('/owoembed', async (request: any) => {
  console.log('oembed hit!');
  const { searchParams } = new URL(request.url);

  /* Fallbacks */
  let text = searchParams.get('text') || 'Twitter';
  let author = searchParams.get('author') || 'dangeredwolf';
  let status = searchParams.get('status') || '1547514042146865153';

  const test = {
    author_name: decodeURIComponent(text),
    author_url: `${Constants.TWITTER_ROOT}/${encodeURIComponent(
      author
    )}/status/${encodeURIComponent(status)}`,
    provider_name: Constants.BRANDING_NAME,
    provider_url: Constants.REDIRECT_URL,
    title: Strings.TWITTER,
    type: 'link',
    version: '1.0'
  };
  return new Response(JSON.stringify(test), {
    headers: Constants.RESPONSE_HEADERS,
    status: 200
  });
});

router.get('/:handle', profileRequest);
router.get('/:handle/', profileRequest);

router.all('*', async request => {
  return Response.redirect(Constants.REDIRECT_URL, 307);
});

/*
  Event to receive web requests on Cloudflare Worker
*/
addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(router.handle(event.request, event));
});

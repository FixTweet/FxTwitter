import { Router } from 'itty-router';
import { Constants } from './constants';
import { fetchUsingGuest } from './drivers/guest';
import { handleStatus } from './status';

/*
  Useful little function to format strings for us
*/

declare global {
  interface String {
    format(options: any): string;
  }
}

String.prototype.format = function (options: any) {
  return this.replace(/{([^{}]+)}/g, (match: string, name: string) => {
    if (options[name] !== undefined) {
      return options[name];
    }
    return match;
  });
};

const router = Router();

const statusRequest = async (request: any) => {
  const { handle, id, mediaNumber } = request.params;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent');

  if (userAgent.match(/bot/ig) !== null) {
    return new Response(await handleStatus(handle, id, mediaNumber), {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
      status: 200
    });
  } else {
    return Response.redirect(`${Constants.TWITTER_ROOT}${url.pathname}`, 302);
  }
}

router.get('/:handle/status/:id', statusRequest);
router.get('/:handle/status/:id/photo/:mediaNumber', statusRequest);
router.get('/:handle/status/:id/video/:mediaNumber', statusRequest);
router.get('/:handle/statuses/:id', statusRequest);
router.get('/:handle/statuses/:id/photo/:mediaNumber', statusRequest);
router.get('/:handle/statuses/:id/video/:mediaNumber', statusRequest);

router.get('/owoembed', async (request: any) => {
  console.log("THE OWOEMBED HAS BEEN ACCESSED!!!!!!!!!");
  const { searchParams } = new URL(request.url)

  let text = searchParams.get('text') || 'Twitter';

  const test = {
    "author_name":text,
    "author_url":"https://twitter.com/AquosTheWolf/status/1547447632284553216",
    "provider_name":"pxTwitter",
    "provider_url":"https://github.com/dangeredwolf/pxtwitter",
    "title":"test",
    "type":"link",
    "version":"1.0"
  }
  return new Response(JSON.stringify(test), {
    headers: {
      'content-type': 'application/json',
    },
    status: 200
  });
})

router.all('*', async request => {
  return Response.redirect(Constants.REDIRECT_URL);
});

/*
  Event to receive web requests on Cloudflare Worker
*/
addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(router.handle(event.request));
});

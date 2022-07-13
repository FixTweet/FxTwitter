import { Router } from 'itty-router';
import { Constants } from './constants';
import { fetchUsingGuest } from './drivers/guest';

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

router.get('/:handle/status/:id', async (request: any) => {
  const { handle, id } = request.params;
  return new Response(await fetchUsingGuest(handle, id), { status: 200 });
});

router.all('*', async request => {
  return Response.redirect(Constants.REDIRECT_URL);
});

/*
  Event to receive web requests on Cloudflare Worker
*/
addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(router.handle(event.request));
});

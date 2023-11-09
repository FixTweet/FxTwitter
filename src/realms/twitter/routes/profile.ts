import { Context } from 'hono';
import { Constants } from '../../../constants';
import { handleProfile } from '../../../user';
import { getBaseRedirectUrl } from '../router';

/* Handler for User Profiles */
export const profileRequest = async (c: Context) => {
  const handle = c.req.param('handle');
  const url = new URL(c.req.url);
  const userAgent = c.req.header('User-Agent') || '';
  const flags: InputFlags = {};

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
    return c.redirect(Constants.REDIRECT_URL, 302);
  }
  const username = handle.match(/\w{1,15}/gi)?.[0] as string;
  /* Check if request is to api.fxtwitter.com */
  if (Constants.API_HOST_LIST.includes(url.hostname)) {
    console.log('JSON API request');
    flags.api = true;
  }

  const baseUrl = getBaseRedirectUrl(c);

  /* Do not cache if using a custom redirect */
  const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;
  
  if (cacheControl) {
    c.header('cache-control', cacheControl);
  }
  /* Direct media or API access bypasses bot check, returning same response regardless of UA */
  if (isBotUA || flags.api) {
    if (isBotUA) {
      console.log(`Matched bot UA ${userAgent}`);
    } else {
      console.log('Bypass bot check');
    }

    /* This throws the necessary data to handleStatus (in status.ts) */
    const profileResponse = await handleProfile(c, username, flags);
    /* Check for custom redirect */

    if (!isBotUA) {
      return c.redirect(`${baseUrl}/${handle}`, 302);
    }

    /* Return the response containing embed information */
    return profileResponse;
  } else {
    /* A human has clicked a fxtwitter.com/:screen_name link!
        Obviously we just need to redirect to the user directly.*/
    console.log('Matched human UA', userAgent);

    return c.redirect(`${baseUrl}/${handle}`, 302)
  }
};

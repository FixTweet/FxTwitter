import { Context } from 'hono';
import { Constants } from '../../../constants';
import { getBaseRedirectUrl } from '../router';
import { DataProvider } from '../../../embed/status';
import { Strings } from '../../../strings';
import { handleActivity } from '../../../embed/activity';
import { InputFlags } from '../../../types/types';

/* Handler for activity request */
export const activityRequest = async (c: Context) => {
  const { prefix, id } = c.req.param();
  const url = new URL(c.req.url);
  const flags: InputFlags = {};

  /* Check if domain is a direct media domain (i.e. d.fxtwitter.com),
     the status is prefixed with /dl/ or /dir/ (for TwitFix interop), or the
     status ends in .mp4, .jpg, .jpeg, or .png
      
     Note that .png is not documented because images always redirect to a jpg,
     but it will help someone who does it mistakenly on something like Discord
      
     Also note that all we're doing here is setting the direct flag. If someone
     links a video and ends it with .jpg, it will still redirect to a .mp4! */
  if (url.pathname.match(/\/status(es)?\/\d{2,20}\.(mp4|png|jpe?g|gifv?)/g)) {
    console.log('Direct media request by extension');
    flags.direct = true;
  } else if (Constants.DIRECT_MEDIA_DOMAINS.includes(url.hostname)) {
    console.log('Direct media request by domain');
    flags.direct = true;
  } else if (Constants.TEXT_ONLY_DOMAINS.includes(url.hostname)) {
    console.log('Text-only embed request');
    flags.textOnly = true;
  } else if (Constants.GALLERY_DOMAINS.includes(url.hostname)) {
    console.log('Gallery embed request');
    flags.gallery = true;
  } else if (Constants.NATIVE_MULTI_IMAGE_DOMAINS.includes(url.hostname)) {
    console.log('Force native multi-image');
    flags.nativeMultiImage = true;
  } else if (prefix === 'dl' || prefix === 'dir') {
    console.log('Direct media request by path prefix');
    flags.direct = true;
  }

  /* Support redirecting to specific quality of image, like:
  
     https://pbs.twimg.com/media/foobar.jpg:orig
    
     TODO: Should we support video file like :1280x720, though it's not the offical way */
  if (flags.direct) {
    // check if the name is in search params, e.g. /i/status/1234567890?name=orig
    const nameFromSearchParams = url.searchParams.get('name');
    if (nameFromSearchParams) {
      flags.name = nameFromSearchParams;
    } else {
      // check if the status ends with :<name>, e.g. /i/status/1234567890.jpg:orig
      const matched = url.pathname.match(/\/status(?:es)?\/.+:([^:]+?)$/);
      const nameFromUrl = matched && matched[1];
      if (nameFromUrl) {
        flags.name = nameFromUrl;
      }
    }
  }

  /* TODO: Figure out what we're doing with FixTweet / FixupX branding in future */
  if (/twitt/g.test(url.href)) {
    console.log(`We're using twitter domain`);
    flags.isXDomain = false;
  } else {
    console.log(`We're using x domain`);
    flags.isXDomain = true;
  }

  const baseUrl = getBaseRedirectUrl(c);

  /* This throws the necessary data to handleStatus (in status.ts) */
  const statusResponse = await handleActivity(c, id ?? '0', DataProvider.Twitter);
  /* Do not cache if using a custom redirect */
  const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

  if (cacheControl) {
    // eslint-disable-next-line sonarjs/no-duplicate-string
    c.header('cache-control', cacheControl);
  }

  if (statusResponse) {
    c.status(200);
    /* Return the response containing embed information */
    return statusResponse;
  } else {
    /* Somehow handleStatus sent us nothing. This should *never* happen, but we have a case for it. */
    return c.text(Strings.ERROR_UNKNOWN, 500);
  }
};

import { Context } from 'hono';
import { Constants } from '../../../constants';
import { DataProvider } from '../../../embed/status';
import { Strings } from '../../../strings';
import { handleActivity } from '../../../embed/activity';

/* Handler for activity request */
export const activityRequest = async (c: Context) => {
  const { prefix, snowcode } = c.req.param();
  const url = new URL(c.req.url);
  const flags: InputFlags = {};

  /* Check if domain is a direct media domain (i.e. d.fxbsky.app),
     or the status ends in .mp4, .jpg, .jpeg, or .png
      
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

  /* This throws the necessary data to handleStatus (in status.ts) */
  const statusResponse = await handleActivity(
    c,
    snowcode ?? '0',
    DataProvider.Bsky
  );


  if (statusResponse) {
    c.status(200);
    /* Return the response containing embed information */
    return statusResponse;
  } else {
    /* Somehow handleStatus sent us nothing. This should *never* happen, but we have a case for it. */
    return c.text(Strings.ERROR_UNKNOWN, 500);
  }
};

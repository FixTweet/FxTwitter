import { Context } from 'hono';
import { Strings } from '../../../strings';
import { sanitizeText } from '../../../helpers/utils';
import { getBaseRedirectUrl } from '../router';
import { Constants } from '../../../constants';

export const genericTwitterRedirect = async (c: Context) => {
  const url = new URL(c.req.url);
  const baseUrl = getBaseRedirectUrl(c);
  /* Do not cache if using a custom redirect */
  const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

  if (cacheControl) {
    c.header('cache-control', cacheControl);
  }

  return c.redirect(`${baseUrl}${url.pathname}`, 302);
};

export const setRedirectRequest = async (c: Context) => {
  /* Query params */
  const { searchParams } = new URL(c.req.url);
  let url = searchParams.get('url');

  /* Check that origin either does not exist or is in our domain list */
  const origin = c.req.header('origin');
  if (origin && !Constants.STANDARD_DOMAIN_LIST.includes(new URL(origin).hostname)) {
    c.status(403);

    return c.html(
      Strings.MESSAGE_HTML.format({
        message: `Failed to set base redirect: Your request seems to be originating from another domain, please open this up in a new tab if you are trying to set your base redirect.`
      })
    );
  }

  if (!url) {
    /* Remove redirect URL */
    c.header(
      // eslint-disable-next-line sonarjs/no-duplicate-string
      'set-cookie',
      `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`
    );
    c.header(
      // eslint-disable-next-line sonarjs/no-duplicate-string
      'content-security-policy',
      `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`
    );
    c.status(200);
    return c.html(
      Strings.MESSAGE_HTML.format({
        message: `Your base redirect has been cleared. To set one, please pass along the <code>url</code> parameter.`
      })
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

      c.header(
        'set-cookie',
        `base_redirect=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; HttpOnly`
      );
      c.header(
        'content-security-policy',
        `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`
      );
      c.status(200);
      return c.html(
        Strings.MESSAGE_HTML.format({
          message: `Your URL does not appear to be well-formed. Example: ?url=https://nitter.net`
        })
      );
    }

    url = `https://${url}`;
  }

  c.header('set-cookie', `base_redirect=${url}; path=/; max-age=63072000; secure; HttpOnly`);
  c.header(
    'content-security-policy',
    `frame-ancestors ${Constants.STANDARD_DOMAIN_LIST.join(' ')};`
  );

  return c.html(
    Strings.MESSAGE_HTML.format({
      message: `Successfully set base redirect, you will now be redirected to ${sanitizeText(
        url
      )} rather than ${Constants.TWITTER_ROOT}`
    })
  );
};

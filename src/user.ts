import { Context } from 'hono';
import { Constants } from './constants';
import { Strings } from './strings';
import { userAPI } from './providers/twitter/profile';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { getBranding } from './helpers/branding';

export const returnError = (c: Context, error: string): Response => {
  const branding = getBranding(c);
  return c.html(
    Strings.BASE_HTML.format({
      lang: '',
      headers: [
        `<meta property="og:title" content="${branding.name}"/>`,
        `<meta property="og:description" content="${error}"/>`,
        `<meta property="theme-color" content="${branding.color}"/>`
      ].join('')
    })
  ) as Response;
};

/* Handler for Twitter users */
export const handleProfile = async (
  c: Context,
  username: string,
  flags: InputFlags
): Promise<Response> => {
  console.log('Direct?', flags?.direct);

  const api = await userAPI(username, c);
  const user = api?.user as APIUser;

  /* Catch this request if it's an API response */
  // For now we just always return the API response while testing
  if (flags?.api) {
    c.status(api.code as ContentfulStatusCode);
    // Add every header from Constants.API_RESPONSE_HEADERS
    for (const [header, value] of Object.entries(Constants.API_RESPONSE_HEADERS)) {
      c.header(header, value);
    }
    return c.json(api);
  }

  /* If there was any errors fetching the User, we'll return it */
  switch (api.code) {
    case 401:
      return returnError(c, Strings.ERROR_PRIVATE);
    case 404:
      return returnError(c, Strings.ERROR_USER_NOT_FOUND);
    case 500:
      return returnError(c, Strings.ERROR_API_FAIL);
  }

  /* Base headers included in all responses */
  const headers = [`<meta property="twitter:site" content="@${user.screen_name}"/>`];

  // TODO Add card creation logic here
  /* Finally, after all that work we return the response HTML! */

  
  const branding = getBranding(c);

  return c.html(
    Strings.BASE_HTML.format({
      brandingName: branding.name,
      lang: `lang="en"`,
      headers: headers.join('')
    })
  );
};
